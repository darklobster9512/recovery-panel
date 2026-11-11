# Fix: Vics keeping an old manager after being given to a caller

## Cause
1. The 5 Vics were first given to the manager "Der Ficker" in the Manager tab under Vics. That sets the manager and clears the caller.
2. Later they were given to Felix Brandt in the Caller tab, either by hand or by the lead sync.
3. When a Vic gets a caller, the manager is only replaced if that caller has a manager. Felix has none, so the old manager "Der Ficker" stayed on the Vic.

## Change
- When a Vic is given to a caller, its manager is always set to that caller's manager. If the caller has no manager, the Vic's manager is cleared.
- One-time cleanup: every Vic whose caller has no manager, or a different manager, gets the caller's manager (or none). This covers Felix Brandt's 5 Vics.

## Technical details
- Migration: in `profiles_manager_rules()`, set `NEW.assigned_manager_id := m` (also when `m` is NULL) whenever `assigned_caller_id` changes to a non-null caller.
- Data fix: update profiles p set assigned_manager_id = (select manager_id from manager_callers where caller_id = p.assigned_caller_id) where assigned_caller_id is not null and the value differs.
