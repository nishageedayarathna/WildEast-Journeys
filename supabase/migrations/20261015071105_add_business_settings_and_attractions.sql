/*
# Add business settings, attractions, and review moderation

## What this migration does

1. **New table: `business_settings`**
   - Stores a single row of business contact information (name, email, phone, WhatsApp, address, social links, booking instructions).
   - Used by the public website instead of hardcoded placeholder values.
   - Only admins can read/update; the public can read via a SECURITY DEFINER function (see below).

2. **New table: `attractions`**
   - Stores named attractions (sights, landmarks, natural features) linked to a destination by slug.
   - Public can read published attractions; only admins can create/edit/delete.

3. **New function: `get_business_settings()`**
   - SECURITY DEFINER function that returns the single settings row.
   - Allows the anon key to read settings without granting direct table access.

4. **Inquiries status check constraint**
   - Adds a CHECK constraint on `inquiries.status` to restrict to: new, contacted, confirmed, closed.

## Security
- RLS enabled on `business_settings` — only admins can SELECT/UPDATE directly. No INSERT/DELETE (single-row table seeded by migration).
- RLS enabled on `attractions` — public can SELECT published rows; only admins can INSERT/UPDATE/DELETE.
- `get_business_settings()` is SECURITY DEFINER, executable by anon + authenticated, returns the settings row safely.

## Important notes
1. The migration seeds one empty business_settings row with empty strings — the admin fills in real values. No fake contact details are invented.
2. The inquiries status CHECK constraint uses `IF NOT EXISTS` guard for idempotency.
3. `get_business_settings()` uses `SECURITY DEFINER` so the anon role can read settings even though the table's SELECT policy is admin-only.
*/

-- ============================================================
-- business_settings table (single row)
-- ============================================================
CREATE TABLE IF NOT EXISTS business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  whatsapp_number text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  social_facebook text NOT NULL DEFAULT '',
  social_instagram text NOT NULL DEFAULT '',
  social_twitter text NOT NULL DEFAULT '',
  booking_instructions text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Seed one row if none exists
INSERT INTO business_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM business_settings);

-- Drop existing policies if any, then create
DROP POLICY IF EXISTS "admins_read_business_settings" ON business_settings;
CREATE POLICY "admins_read_business_settings"
  ON business_settings FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admins_update_business_settings" ON business_settings;
CREATE POLICY "admins_update_business_settings"
  ON business_settings FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- ============================================================
-- get_business_settings() — SECURITY DEFINER function
-- ============================================================
CREATE OR REPLACE FUNCTION get_business_settings()
RETURNS business_settings
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM business_settings LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_business_settings() TO anon, authenticated;

-- ============================================================
-- attractions table
-- ============================================================
CREATE TABLE IF NOT EXISTS attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_slug text REFERENCES destinations(slug) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_attractions" ON attractions;
CREATE POLICY "public_read_published_attractions"
  ON attractions FOR SELECT
  TO anon, authenticated
  USING (published = true OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admins_insert_attractions" ON attractions;
CREATE POLICY "admins_insert_attractions"
  ON attractions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admins_update_attractions" ON attractions;
CREATE POLICY "admins_update_attractions"
  ON attractions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP POLICY IF EXISTS "admins_delete_attractions" ON attractions;
CREATE POLICY "admins_delete_attractions"
  ON attractions FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- ============================================================
-- Inquiries status CHECK constraint
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'inquiries_status_check'
      AND table_name = 'inquiries'
  ) THEN
    ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check
      CHECK (status IN ('new', 'contacted', 'confirmed', 'closed'));
  END IF;
END $$;