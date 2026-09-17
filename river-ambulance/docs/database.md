# Database Schema

## Overview
The River Ambulance Dispatch system uses PostgreSQL as its primary database. The schema is designed to track boat availability, shift handoffs, and the lifecycle of dispatch requests.

## Tables

### `boats`
Tracks the current status and supplies of the 5 boat ambulances.
- **`id`** (UUID, PK)
- **`boat_number`** (VARCHAR, UNIQUE): E.g., 'BA-01'
- **`boat_name`** (VARCHAR)
- **`status`** (`boat_status` ENUM): `AVAILABLE`, `ASSIGNED`, `ON_TRIP`, `MAINTENANCE`
- **`fuel_percentage`** (NUMERIC): 0-100
- **`oxygen_tanks`** (INTEGER): >= 0
- **`current_location`** (VARCHAR)
- **`created_at`, `updated_at`** (TIMESTAMPTZ)

### `dispatch_requests`
Tracks emergency requests.
- **`id`** (UUID, PK)
- **`pickup_location`** (VARCHAR)
- **`urgency`** (`urgency_level` ENUM): `CRITICAL`, `HIGH`, `NORMAL`
- **`patient_condition`** (`patient_condition` ENUM): `CRITICAL`, `SERIOUS`, `STABLE`, `UNKNOWN`
- **`requested_by`** (VARCHAR)
- **`assigned_boat_id`** (UUID, FK to `boats`)
- **`status`** (`request_status` ENUM): `OPEN`, `ASSIGNED`, `COMPLETED`, `CANCELLED`
- **`notes`** (TEXT)
- **`created_at`, `claimed_at`, `completed_at`** (TIMESTAMPTZ)

### `dispatch_events`
Audit log of all state transitions.
- **`id`** (UUID, PK)
- **`request_id`** (UUID, FK to `dispatch_requests`)
- **`boat_id`** (UUID, FK to `boats`)
- **`event_type`** (`dispatch_event_type` ENUM)
- **`actor`** (VARCHAR)
- **`metadata`** (JSONB)
- **`created_at`** (TIMESTAMPTZ)

### `shift_handoffs`
Records taken when shifts change.
- **`id`** (UUID, PK)
- **`boat_id`** (UUID, FK to `boats`)
- **`outgoing_captain`** (VARCHAR)
- **`incoming_captain`** (VARCHAR)
- **`fuel_percentage`** (NUMERIC)
- **`oxygen_tanks`** (INTEGER)
- **`notes`** (TEXT)
- **`created_at`** (TIMESTAMPTZ)

## Security
Row Level Security (RLS) is enabled on all tables.
- Read operations are currently public for prototype visibility.
- Insert/Update operations are public for the prototype but in production should be restricted.
- Critical operations are managed via `SECURITY DEFINER` RPCs to enforce business logic over direct data manipulation.
