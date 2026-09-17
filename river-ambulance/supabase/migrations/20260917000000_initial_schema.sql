-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Custom Types
CREATE TYPE boat_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'ON_TRIP', 'MAINTENANCE');
CREATE TYPE urgency_level AS ENUM ('CRITICAL', 'HIGH', 'NORMAL');
CREATE TYPE request_status AS ENUM ('OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED');
CREATE TYPE patient_condition AS ENUM ('CRITICAL', 'SERIOUS', 'STABLE', 'UNKNOWN');
CREATE TYPE dispatch_event_type AS ENUM (
  'REQUEST_CREATED', 
  'JOB_CLAIMED', 
  'JOB_STARTED', 
  'JOB_COMPLETED', 
  'JOB_CANCELLED', 
  'HANDOFF_RECORDED'
);

-- 2. Create Tables

-- BOATS
CREATE TABLE boats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boat_number VARCHAR(10) NOT NULL UNIQUE,
    boat_name VARCHAR(100) NOT NULL,
    status boat_status NOT NULL DEFAULT 'AVAILABLE',
    fuel_percentage NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    oxygen_tanks INTEGER NOT NULL DEFAULT 0,
    current_location VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_fuel_percentage CHECK (fuel_percentage >= 0 AND fuel_percentage <= 100),
    CONSTRAINT chk_oxygen_tanks CHECK (oxygen_tanks >= 0)
);

-- DISPATCH REQUESTS
CREATE TABLE dispatch_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pickup_location VARCHAR(255) NOT NULL,
    urgency urgency_level NOT NULL,
    patient_condition patient_condition NOT NULL,
    requested_by VARCHAR(100) NOT NULL,
    assigned_boat_id UUID REFERENCES boats(id) ON DELETE SET NULL,
    status request_status NOT NULL DEFAULT 'OPEN',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    claimed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- DISPATCH EVENTS
CREATE TABLE dispatch_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES dispatch_requests(id) ON DELETE CASCADE,
    boat_id UUID REFERENCES boats(id) ON DELETE SET NULL,
    event_type dispatch_event_type NOT NULL,
    actor VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SHIFT HANDOFFS
CREATE TABLE shift_handoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boat_id UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
    outgoing_captain VARCHAR(100) NOT NULL,
    incoming_captain VARCHAR(100) NOT NULL,
    fuel_percentage NUMERIC(5, 2) NOT NULL,
    oxygen_tanks INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_handoff_fuel CHECK (fuel_percentage >= 0 AND fuel_percentage <= 100),
    CONSTRAINT chk_handoff_oxygen CHECK (oxygen_tanks >= 0)
);


-- 3. Trigger for updated_at on boats
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_boats_modtime
BEFORE UPDATE ON boats
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();


-- 4. Indexes
CREATE INDEX idx_boats_status ON boats(status);
CREATE INDEX idx_dispatch_req_status ON dispatch_requests(status);
CREATE INDEX idx_dispatch_events_request_id ON dispatch_events(request_id);
CREATE INDEX idx_shift_handoffs_boat_id ON shift_handoffs(boat_id);


-- 5. RPC Functions

-- claim_dispatch_request
CREATE OR REPLACE FUNCTION claim_dispatch_request(
    p_request_id UUID, 
    p_boat_id UUID, 
    p_captain_name VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request dispatch_requests%ROWTYPE;
    v_boat boats%ROWTYPE;
BEGIN
    -- Lock the request first to prevent concurrent claims of the same request
    SELECT * INTO v_request 
    FROM dispatch_requests 
    WHERE id = p_request_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;

    IF v_request.status != 'OPEN' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request is no longer OPEN');
    END IF;

    -- Lock the boat to prevent concurrent assignment of the same boat
    SELECT * INTO v_boat 
    FROM boats 
    WHERE id = p_boat_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boat not found');
    END IF;

    IF v_boat.status != 'AVAILABLE' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boat is not AVAILABLE');
    END IF;

    -- Proceed with updates
    UPDATE dispatch_requests 
    SET status = 'ASSIGNED', 
        assigned_boat_id = p_boat_id, 
        claimed_at = NOW()
    WHERE id = p_request_id;

    UPDATE boats 
    SET status = 'ASSIGNED'
    WHERE id = p_boat_id;

    INSERT INTO dispatch_events (request_id, boat_id, event_type, actor, metadata)
    VALUES (p_request_id, p_boat_id, 'JOB_CLAIMED', p_captain_name, jsonb_build_object('boat_number', v_boat.boat_number));

    RETURN jsonb_build_object('success', true, 'message', 'Job claimed successfully');
END;
$$;


-- start_dispatch
CREATE OR REPLACE FUNCTION start_dispatch(
    p_request_id UUID, 
    p_boat_id UUID,
    p_actor VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request dispatch_requests%ROWTYPE;
BEGIN
    SELECT * INTO v_request FROM dispatch_requests WHERE id = p_request_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;

    IF v_request.status != 'ASSIGNED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request is not ASSIGNED');
    END IF;

    IF v_request.assigned_boat_id != p_boat_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boat mismatch');
    END IF;

    -- Update boat status
    UPDATE boats SET status = 'ON_TRIP' WHERE id = p_boat_id AND status = 'ASSIGNED';
    
    INSERT INTO dispatch_events (request_id, boat_id, event_type, actor)
    VALUES (p_request_id, p_boat_id, 'JOB_STARTED', p_actor);

    RETURN jsonb_build_object('success', true);
END;
$$;


-- complete_dispatch
CREATE OR REPLACE FUNCTION complete_dispatch(
    p_request_id UUID, 
    p_boat_id UUID,
    p_actor VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request dispatch_requests%ROWTYPE;
BEGIN
    SELECT * INTO v_request FROM dispatch_requests WHERE id = p_request_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;

    IF v_request.status IN ('COMPLETED', 'CANCELLED') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request already completed/cancelled');
    END IF;

    UPDATE dispatch_requests 
    SET status = 'COMPLETED', completed_at = NOW()
    WHERE id = p_request_id;

    -- Return boat to AVAILABLE
    UPDATE boats 
    SET status = 'AVAILABLE'
    WHERE id = p_boat_id;

    INSERT INTO dispatch_events (request_id, boat_id, event_type, actor)
    VALUES (p_request_id, p_boat_id, 'JOB_COMPLETED', p_actor);

    RETURN jsonb_build_object('success', true);
END;
$$;


-- record_handoff
CREATE OR REPLACE FUNCTION record_handoff(
    p_boat_id UUID,
    p_outgoing_captain VARCHAR,
    p_incoming_captain VARCHAR,
    p_fuel_percentage NUMERIC,
    p_oxygen_tanks INTEGER,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Server-side validation
    IF p_fuel_percentage < 0 OR p_fuel_percentage > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Fuel percentage must be between 0 and 100');
    END IF;

    IF p_oxygen_tanks < 0 OR p_oxygen_tanks > 20 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Oxygen tanks must be between 0 and 20');
    END IF;

    INSERT INTO shift_handoffs (boat_id, outgoing_captain, incoming_captain, fuel_percentage, oxygen_tanks, notes)
    VALUES (p_boat_id, p_outgoing_captain, p_incoming_captain, p_fuel_percentage, p_oxygen_tanks, p_notes);

    UPDATE boats
    SET fuel_percentage = p_fuel_percentage,
        oxygen_tanks = p_oxygen_tanks
    WHERE id = p_boat_id;
    
    INSERT INTO dispatch_events (boat_id, event_type, actor, metadata)
    VALUES (p_boat_id, 'HANDOFF_RECORDED', p_outgoing_captain, jsonb_build_object('incoming_captain', p_incoming_captain));

    RETURN jsonb_build_object('success', true);
END;
$$;



-- 6. Row Level Security (RLS)
ALTER TABLE boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to boats" ON boats FOR SELECT USING (true);
CREATE POLICY "Allow public read access to dispatch_requests" ON dispatch_requests FOR SELECT USING (true);
CREATE POLICY "Allow public read access to dispatch_events" ON dispatch_events FOR SELECT USING (true);
CREATE POLICY "Allow public read access to shift_handoffs" ON shift_handoffs FOR SELECT USING (true);

-- Allow inserts since we don't have proper auth yet
CREATE POLICY "Allow public insert to dispatch_requests" ON dispatch_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to dispatch_events" ON dispatch_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to shift_handoffs" ON shift_handoffs FOR INSERT WITH CHECK (true);

-- Updates via RPC usually bypass RLS, but for good measure:
CREATE POLICY "Allow public update to dispatch_requests" ON dispatch_requests FOR UPDATE USING (true);
CREATE POLICY "Allow public update to boats" ON boats FOR UPDATE USING (true);


-- 7. Seed Data

INSERT INTO boats (boat_number, boat_name, status, fuel_percentage, oxygen_tanks) VALUES
('BA-01', 'Boat 1', 'AVAILABLE', 86.00, 5),
('BA-02', 'Boat 2', 'AVAILABLE', 64.00, 3),
('BA-03', 'Boat 3', 'ON_TRIP', 72.00, 4),
('BA-04', 'Boat 4', 'AVAILABLE', 91.00, 6),
('BA-05', 'Boat 5', 'MAINTENANCE', 18.00, 1);

INSERT INTO dispatch_requests (pickup_location, urgency, patient_condition, requested_by, status, created_at, completed_at, assigned_boat_id) 
VALUES
('Island A - North dock', 'HIGH', 'SERIOUS', 'Nurse Priya', 'COMPLETED', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 23 hours', (SELECT id FROM boats WHERE boat_number = 'BA-01')),
('Island B - East beach', 'CRITICAL', 'CRITICAL', 'Dr. Meera', 'COMPLETED', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', (SELECT id FROM boats WHERE boat_number = 'BA-02')),
('Island C - Clinic', 'NORMAL', 'STABLE', 'Health Worker Arun', 'COMPLETED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', (SELECT id FROM boats WHERE boat_number = 'BA-04'));
