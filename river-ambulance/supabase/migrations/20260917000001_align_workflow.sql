-- Migration to align workflow

-- 1. Add ON_TRIP to request_status ENUM
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'ON_TRIP' AFTER 'ASSIGNED';

-- 2. Update start_dispatch RPC
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
    
    -- Update request status
    UPDATE dispatch_requests SET status = 'ON_TRIP' WHERE id = p_request_id;
    
    INSERT INTO dispatch_events (request_id, boat_id, event_type, actor)
    VALUES (p_request_id, p_boat_id, 'JOB_STARTED', p_actor);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. Update complete_dispatch RPC
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
    v_boat boats%ROWTYPE;
BEGIN
    SELECT * INTO v_request FROM dispatch_requests WHERE id = p_request_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;

    -- Enforce ON_TRIP status
    IF v_request.status != 'ON_TRIP' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request is not ON_TRIP');
    END IF;
    
    SELECT * INTO v_boat FROM boats WHERE id = p_boat_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boat not found');
    END IF;

    IF v_boat.status != 'ON_TRIP' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boat is not ON_TRIP');
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
