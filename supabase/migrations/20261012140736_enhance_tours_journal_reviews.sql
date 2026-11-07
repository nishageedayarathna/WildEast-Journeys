/*
# Enhance tour details, journal metadata, and moderated reviews

1. Modified tables
- `tours`: adds group size, meeting point, drop-off, important information, restrictions, packing guidance, cancellation policy, and optional adult/child prices.
- `articles`: adds an optional publication date for editorial display and SEO metadata.
- `inquiries`: adds adult/child counts and the selected tour option while preserving existing inquiry rows.

2. New tables
- `reviews`: stores visitor-submitted ratings and comments for a tour, held for moderation before publication.

3. Security
- Public visitors can read only approved reviews and submit unapproved reviews.
- Administrators can moderate, edit, or delete reviews.
- Existing admin-only content and inquiry policies remain in place.

4. Important notes
- New tour fields are nullable or have safe defaults so existing tours remain valid.
- Prices remain optional; the interface must show “Price on request” when no verified value exists.
- Email delivery is not enabled by this migration; inquiries remain durably stored regardless of email configuration.
*/

ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS group_size text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS meeting_point text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS dropoff text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS important_info text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS restrictions text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS what_to_bring text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS cancellation_policy text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS adult_price numeric;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS child_price numeric;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS published_at date;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS adults integer NOT NULL DEFAULT 1 CHECK (adults BETWEEN 1 AND 30);
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS children integer NOT NULL DEFAULT 0 CHECK (children BETWEEN 0 AND 30);
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS tour_option text;

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_approved_reviews" ON public.reviews;
CREATE POLICY "public_read_approved_reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (approved = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "public_submit_reviews" ON public.reviews;
CREATE POLICY "public_submit_reviews" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (approved = false);
DROP POLICY IF EXISTS "admins_update_reviews" ON public.reviews;
CREATE POLICY "admins_update_reviews" ON public.reviews FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "admins_delete_reviews" ON public.reviews;
CREATE POLICY "admins_delete_reviews" ON public.reviews FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE INDEX IF NOT EXISTS reviews_tour_id_idx ON public.reviews (tour_id);
CREATE INDEX IF NOT EXISTS reviews_approved_idx ON public.reviews (approved);
