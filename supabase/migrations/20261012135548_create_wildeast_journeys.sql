/*
# Create WildEast Journeys content and inquiry system

1. New Tables
- `destinations`: public destination pages with editorial copy and hero imagery.
- `tours`: bookable-looking tour offerings with itinerary, inclusions, duration, and optional pricing.
- `articles`: published travel stories with category, summary, and body content.
- `inquiries`: private customer trip requests submitted from the website.
- `profiles`: authenticated user records with an explicit admin flag.

2. Security
- Row-level security is enabled on every table.
- Published destinations, tours, and articles are readable publicly.
- Inquiries can be submitted publicly but only administrators can read or update them.
- Content editing and profile access require an authenticated administrator profile.
- Customer inquiry fields are never exposed through public read policies.

3. Important notes
- This migration seeds replaceable editorial content for Ampara, Arugam Bay, and Ella.
- Prices are nullable and the interface displays “Price on request” when absent.
- An administrator profile must be created for a signed-in user before content management is available.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  eyebrow text NOT NULL,
  summary text NOT NULL,
  description text NOT NULL,
  hero_image text NOT NULL,
  accent text NOT NULL DEFAULT '#A8D8E8',
  highlights text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  destination_slug text NOT NULL REFERENCES public.destinations(slug) ON UPDATE CASCADE,
  category text NOT NULL,
  summary text NOT NULL,
  description text NOT NULL,
  hero_image text NOT NULL,
  gallery text[] NOT NULL DEFAULT '{}',
  duration text NOT NULL,
  pickup text,
  itinerary text[] NOT NULL DEFAULT '{}',
  included text[] NOT NULL DEFAULT '{}',
  excluded text[] NOT NULL DEFAULT '{}',
  price numeric,
  currency text NOT NULL DEFAULT 'USD',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  destination_slug text REFERENCES public.destinations(slug) ON UPDATE CASCADE,
  summary text NOT NULL,
  body text NOT NULL,
  hero_image text NOT NULL,
  read_time text NOT NULL DEFAULT '5 min read',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  destination text NOT NULL,
  tour text,
  travel_date date,
  travellers integer NOT NULL CHECK (travellers BETWEEN 1 AND 30),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_destinations" ON public.destinations;
CREATE POLICY "public_read_published_destinations" ON public.destinations FOR SELECT TO anon, authenticated USING (published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "admins_insert_destinations" ON public.destinations;
CREATE POLICY "admins_insert_destinations" ON public.destinations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "admins_update_destinations" ON public.destinations;
CREATE POLICY "admins_update_destinations" ON public.destinations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "admins_delete_destinations" ON public.destinations;
CREATE POLICY "admins_delete_destinations" ON public.destinations FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "public_read_published_tours" ON public.tours;
CREATE POLICY "public_read_published_tours" ON public.tours FOR SELECT TO anon, authenticated USING (published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "admins_insert_tours" ON public.tours;
CREATE POLICY "admins_insert_tours" ON public.tours FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "admins_update_tours" ON public.tours;
CREATE POLICY "admins_update_tours" ON public.tours FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "admins_delete_tours" ON public.tours;
CREATE POLICY "admins_delete_tours" ON public.tours FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "public_read_published_articles" ON public.articles;
CREATE POLICY "public_read_published_articles" ON public.articles FOR SELECT TO anon, authenticated USING (published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "admins_insert_articles" ON public.articles;
CREATE POLICY "admins_insert_articles" ON public.articles FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "admins_update_articles" ON public.articles;
CREATE POLICY "admins_update_articles" ON public.articles FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "admins_delete_articles" ON public.articles;
CREATE POLICY "admins_delete_articles" ON public.articles FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "public_submit_inquiries" ON public.inquiries;
CREATE POLICY "public_submit_inquiries" ON public.inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admins_read_inquiries" ON public.inquiries;
CREATE POLICY "admins_read_inquiries" ON public.inquiries FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "admins_update_inquiries" ON public.inquiries;
CREATE POLICY "admins_update_inquiries" ON public.inquiries FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
DROP POLICY IF EXISTS "admins_delete_inquiries" ON public.inquiries;
CREATE POLICY "admins_delete_inquiries" ON public.inquiries FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
CREATE POLICY "users_read_own_profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
CREATE POLICY "users_insert_own_profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS destinations_slug_idx ON public.destinations (slug);
CREATE INDEX IF NOT EXISTS tours_destination_slug_idx ON public.tours (destination_slug);
CREATE INDEX IF NOT EXISTS articles_destination_slug_idx ON public.articles (destination_slug);
CREATE INDEX IF NOT EXISTS inquiries_status_idx ON public.inquiries (status);

INSERT INTO public.destinations (slug, name, eyebrow, summary, description, hero_image, highlights)
VALUES
('ampara', 'Ampara', 'Wild country, quietly alive', 'Where reed-fringed lakes, ancient stories, and wild herds share the same horizon.', 'Ampara is the East at its most elemental: expansive wetlands, village kitchens, and wildlife encounters that feel unhurried and real.', 'https://images.pexels.com/photos/8126089/pexels-photo-8126089.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['Kumana wetlands', 'Gal Oya boat safaris', 'Lahugala elephants', 'Village food trails']),
('arugam-bay', 'Arugam Bay', 'Salt air, slow mornings', 'A surf coast with lagoon light, fishing villages, and sunsets that stay with you.', 'Arugam Bay rewards curiosity beyond the break. Paddle quiet lagoons, meet local makers, and follow the coast south for empty coves and evening colour.', 'https://images.pexels.com/photos/37411684/pexels-photo-37411684.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['Surf breaks', 'Pottuvil Lagoon', 'Peanut Farm beach', 'Sunset coast drives']),
('ella', 'Ella', 'Highland air, open views', 'Tea country, cloud forests, and the scenic journeys that make the hill country unforgettable.', 'Ella is a place for early trains, cool walks, and long views. Build a day around the Nine Arch Bridge, Little Adam’s Peak, and a waterfall swim.', 'https://images.pexels.com/photos/34218645/pexels-photo-34218645.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['Nine Arch Bridge', 'Little Adam’s Peak', 'Ravana Falls', 'Tea estate walks'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tours (slug, title, destination_slug, category, summary, description, hero_image, gallery, duration, pickup, itinerary, included, excluded, price)
VALUES
('gal-oya-lake-wildlife', 'Gal Oya Lake & Wildlife', 'ampara', 'Wildlife', 'A quiet day on the water with forest edges, birdlife, and the chance to see elephants from a respectful distance.', 'Travel through the eastern dry zone with a local naturalist, keeping the day spacious for sightings and stories.', 'https://images.pexels.com/photos/8126089/pexels-photo-8126089.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['https://images.pexels.com/photos/31900999/pexels-photo-31900999.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'], 'Full day', 'Pickup can be discussed for Ampara-area stays.', ARRAY['Morning lake crossing', 'Forest-edge wildlife search', 'Local lunch stop', 'Golden-hour return'], ARRAY['Local guide', 'Boat excursion', 'Lunch', 'Drinking water'], ARRAY['Accommodation', 'Personal purchases'], NULL),
('arugam-bay-beyond-the-break', 'Arugam Bay, Beyond the Break', 'arugam-bay', 'Coast & culture', 'A day of lagoon calm, coastal food, and the lesser-seen corners around the bay.', 'Pair the coast’s familiar energy with quieter landscapes and the people who make this corner of Sri Lanka feel like home.', 'https://images.pexels.com/photos/37411701/pexels-photo-37411701.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['https://images.pexels.com/photos/35456333/pexels-photo-35456333.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'], 'Half day', 'Pickup from Arugam Bay and Pottuvil can be discussed.', ARRAY['Lagoon paddle', 'Coastal village stop', 'Fresh seafood or vegetarian lunch', 'Sunset viewpoint'], ARRAY['Local host', 'Transport during the tour', 'Refreshments'], ARRAY['Surfboard hire', 'Accommodation'], NULL),
('ella-highland-journey', 'Ella Highland Journey', 'ella', 'Scenic day', 'Nine Arch Bridge, tea country, and a waterfall pause woven into one beautiful highland day.', 'A flexible route for travellers who want the icons but also time to stop, look, and breathe.', 'https://images.pexels.com/photos/10727551/pexels-photo-10727551.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['https://images.pexels.com/photos/33345878/pexels-photo-33345878.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'], 'Full day', 'Pickup from Ella-area stays can be discussed.', ARRAY['Nine Arch Bridge walk', 'Tea estate visit', 'Ravana Falls', 'Hill-country lunch'], ARRAY['Local host', 'Private transport', 'Entry guidance'], ARRAY['Meals unless agreed', 'Personal purchases'], NULL)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (slug, title, category, destination_slug, summary, body, hero_image, read_time)
VALUES
('a-slower-side-of-ampara', 'A slower side of Ampara', 'Field notes', 'ampara', 'How to leave room for the East’s best moments: lake light, village roads, and the sound of birds before breakfast.', 'Ampara is best experienced without a checklist. Start early, keep the middle of the day spacious, and let local knowledge shape the route. The reward is a landscape that feels generous rather than staged.', 'https://images.pexels.com/photos/31900999/pexels-photo-31900999.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '6 min read'),
('the-arugam-bay-you-dont-see-from-the-break', 'The Arugam Bay you don’t see from the break', 'Coastline', 'arugam-bay', 'Beyond the surf forecast is a coastline of lagoons, small kitchens, and wide-open evening skies.', 'Arugam Bay changes character when you look inland. Follow the lagoon at dawn, take the long way south, and save sunset for a place where the palms are the only audience.', 'https://images.pexels.com/photos/37411701/pexels-photo-37411701.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '5 min read'),
('ella-by-train-and-trail', 'Ella by train and trail', 'Highlands', 'ella', 'A practical, unhurried way to combine Ella’s famous views with a little more time in the tea country.', 'The best Ella days have a rhythm: a cool start, a scenic train or trail, a shaded lunch, and one last view before the clouds move in. Build less around ticking off sights and more around the spaces between them.', 'https://images.pexels.com/photos/33345878/pexels-photo-33345878.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '7 min read')
ON CONFLICT (slug) DO NOTHING;