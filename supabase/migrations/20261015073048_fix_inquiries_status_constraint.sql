-- The original migration added a constraint named "inquiries_status_check"
-- but the original table already had one with that name, so the IF NOT EXISTS
-- guard caused it to be skipped. The DB still only allows new/in_progress/closed.
-- The admin UI uses new/contacted/confirmed/closed. Fix the constraint to match.

ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;
ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_status_check
  CHECK (status IN ('new', 'contacted', 'confirmed', 'closed'));