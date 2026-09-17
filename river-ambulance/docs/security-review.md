# Security & Database Integrity Review

## Executive Summary

This document presents the security posture, database integrity audit, and prototype risk analysis for the River Ambulance System.

> [!WARNING]
> **PROTOTYPE AUDIT NOTICE**: While critical database-level race conditions and server-side range validations are hardened, this application is operating in **PROTOTYPE SIMULATION MODE**. Production deployment requires full authentication integration (JWT / Supabase Auth) to enforce user identities.

---

## Findings Matrix

| Audit Dimension | Category | Evaluation & Control | Status |
|---|---|---|---|
| **Exposed Secrets** | Environment Security | Frontend uses exclusively `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Service role key (`SUPABASE_SERVICE_KEY`) is **NEVER** committed, bundled, or exposed to the client. | **PASS** |
| **Client Credentials** | API Security | Frontend uses public/anonymous Supabase credentials. Client code cannot perform elevated administrative operations outside of RLS policies. | **PASS** |
| **SQL Injection** | Database Security | PostgreSQL queries utilize parameterized RPC calls and Supabase query builders. No dynamic string concatenation in SQL execution. | **PASS** |
| **Concurrency & Race Conditions** | Data Integrity | `claim_dispatch_request` enforces explicit `SELECT ... FOR UPDATE` row-level locks on both `dispatch_requests` and `boats` tables. Single assignment is guaranteed. | **PASS** |
| **Server-Side Range Validation** | Data Integrity | Added explicit range checks in PostgreSQL RPC `record_handoff` (`0 <= fuel <= 100` and `0 <= oxygen <= 20`). Invalid out-of-bounds payloads are rejected server-side. | **FIXED** |
| **Status Transition Integrity** | State Machine | Status transitions (`OPEN` -> `ASSIGNED` -> `ON_TRIP` -> `COMPLETED`) are strictly enforced within stored procedure logic (`start_dispatch`, `complete_dispatch`). | **PASS** |
| **Unauthorized Direct Table Updates** | Access Control / RLS | Public `UPDATE` policies on `boats` and `dispatch_requests` allow direct table mutations without JWT token verification due to prototype simulation requirements. | **WARNING** |
| **User Identity Verification** | Authentication | Prototype role switcher operates via local browser state (`localStorage`). Captain identity and Health Worker names are submitted as unverified string parameters. | **WARNING** |

---

## Detailed Audit Breakdown

### 1. Concurrency & Race Condition Protection
- **Finding**: **PASS**
- **Mechanism**: The `claim_dispatch_request` stored procedure uses transactional row locking (`FOR UPDATE`). When two captains claim the same request at `t0`:
  - Tx1 locks the request, verifies `status = 'OPEN'`, and assigns the boat.
  - Tx2 blocks until Tx1 commits, then re-evaluates `status != 'OPEN'` and returns `{ success: false, error: "Request is no longer OPEN" }`.
- **Verdict**: Proven zero-duplicate assignment guarantee.

### 2. Server-Side Validation Hardening
- **Finding**: **FIXED**
- **Changes**: Added explicit checks inside `record_handoff` RPC:
  ```sql
  IF p_fuel_percentage < 0 OR p_fuel_percentage > 100 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Fuel percentage must be between 0 and 100');
  END IF;

  IF p_oxygen_tanks < 0 OR p_oxygen_tanks > 20 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Oxygen tanks must be between 0 and 20');
  END IF;
  ```

### 3. Prototype Security Limitations & Next Steps for Production
- **Finding**: **WARNING**
- **Limitations**:
  1. **Anonymous RLS Policies**: RLS policies currently allow public `INSERT` and `UPDATE` access (`USING (true)`) to facilitate rapid prototype demonstration without mandatory Supabase Auth user registration.
  2. **Unauthenticated Actor Claims**: `actor` and `captain_name` parameters rely on client-provided strings.
- **Production Remediation Plan**:
  1. Restrict table `UPDATE` and `INSERT` policies to `auth.uid() IS NOT NULL`.
  2. Map `p_captain_name` and `p_actor` server-side via `auth.jwt() ->> 'name'` or user metadata instead of client parameters.
