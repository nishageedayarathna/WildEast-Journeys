/*
# Lock administrator profile flags

1. Changes
- Prevent authenticated users from inserting or updating `profiles.is_admin` through the browser data API.
- Preserve the allowed profile fields used during account setup.

2. Security
- Administrator status is operator-controlled and cannot be self-assigned.
- Existing administrator records remain unchanged.

3. Important notes
- The first administrator must be enabled by an operator in the database/auth administration workflow.
- The public website and inquiry submission remain unchanged.
*/

REVOKE INSERT ON public.profiles FROM authenticated;
GRANT INSERT (id, display_name) ON public.profiles TO authenticated;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;
