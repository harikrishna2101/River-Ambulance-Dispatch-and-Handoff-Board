# Concurrency & Data-Integrity Audit: Dispatch Claiming

## Executive Summary & Formal Guarantee

This document provides the concurrency and data-integrity audit for the River Ambulance dispatch claiming workflow.

### Audit Verdict: **Scenario A (One Successful Claim, One Controlled Conflict)**

Under high-concurrency race conditions (e.g., Captain 1 using `BA-01` and Captain 2 using `BA-02` attempting to claim the exact same `OPEN` dispatch request at the exact same instant):
- **Result**: Exactly **ONE** captain succeeds (`success: true`), and the other receives a structured **controlled conflict** response (`success: false, error: "Request is no longer OPEN"`).
- **Data Integrity**: **ZERO** duplicate assignments occur. Exactly one boat is assigned to the request, and exactly one `JOB_CLAIMED` event is logged in `dispatch_events`.

---

## Technical Audit Analysis

### 1. Database Implementation (`claim_dispatch_request` RPC)

```sql
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
    -- 1. Acquire exclusive row-level lock on dispatch request
    SELECT * INTO v_request 
    FROM dispatch_requests 
    WHERE id = p_request_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;

    -- 2. Validate request status under lock
    IF v_request.status != 'OPEN' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request is no longer OPEN');
    END IF;

    -- 3. Acquire exclusive row-level lock on boat
    SELECT * INTO v_boat 
    FROM boats 
    WHERE id = p_boat_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boat not found');
    END IF;

    -- 4. Validate boat availability under lock
    IF v_boat.status != 'AVAILABLE' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Boat is not AVAILABLE');
    END IF;

    -- 5. Atomic state mutations
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
```

---

## Transaction & Row-Locking Sequence Trace

### Race Condition Timeline (Captain 1 vs Captain 2 on Request R1)

| Time | Transaction 1 (Captain 1 / BA-01) | Transaction 2 (Captain 2 / BA-02) | PostgreSQL Row Lock State (R1) |
|---|---|---|---|
| `t0` | `claim_dispatch_request(R1, BA-01, 'Captain 1')` initiated | `claim_dispatch_request(R1, BA-02, 'Captain 2')` initiated | Unlocked |
| `t1` | Executes `SELECT ... FOR UPDATE` on `R1` | — | **Tx1 acquires exclusive lock on R1** |
| `t2` | Validates `R1.status == 'OPEN'` (PASS) | Executes `SELECT ... FOR UPDATE` on `R1` | **Tx2 BLOCKED by PostgreSQL on R1 lock** |
| `t3` | Acquires lock on `BA-01` (`FOR UPDATE`) | Blocked waiting for Tx1 | Tx1 holds R1 & BA-01 locks |
| `t4` | Updates `R1.status = 'ASSIGNED'` | Blocked waiting for Tx1 | Tx1 holds R1 & BA-01 locks |
| `t5` | Updates `BA-01.status = 'ASSIGNED'` | Blocked waiting for Tx1 | Tx1 holds R1 & BA-01 locks |
| `t6` | Inserts `JOB_CLAIMED` event | Blocked waiting for Tx1 | Tx1 holds R1 & BA-01 locks |
| `t7` | **Tx1 COMMITS** (`success: true`) & releases locks | **Tx2 UNBLOCKS** & acquires lock on `R1` | Lock transferred to Tx2 |
| `t8` | — | Tx2 reads updated tuple `R1.status = 'ASSIGNED'` | Tx2 holds R1 lock |
| `t9` | — | Evaluates `IF R1.status != 'OPEN'` (TRUE) | Tx2 holds R1 lock |
| `t10` | — | **Tx2 COMMITS** with `{ success: false, error: "Request is no longer OPEN" }` | Locks released |

---

## Frontend Error Handling & User Experience

When Tx2 receives `{ success: false, error: 'Request is no longer OPEN' }`:
1. `claimMutation` in `[src/pages/CaptainQueue.tsx](file:///d:/project/river-ambulance/src/pages/CaptainQueue.tsx)` detects `data.success === false`.
2. Sets `conflictError` state to: `"This request was just claimed by another captain."`
3. Displays a warning banner without crashing or corrupting state.
4. Triggers TanStack Query cache invalidation (`queryClient.invalidateQueries`), which automatically refreshes the queue to remove the claimed request.

---

## Summary of Guarantees

1. **Database-Enforced Atomicity**: Concurrency protection relies entirely on PostgreSQL ACID transaction semantics and row-level locks, independent of frontend UI state.
2. **Single Assignment Invariant**: A dispatch request can never be assigned to more than one boat.
3. **Boat Availability Invariant**: A boat cannot be assigned to multiple active requests simultaneously.
4. **Audit Trail Invariant**: Exactly one `JOB_CLAIMED` audit event is written per successful claim.
