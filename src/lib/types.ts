export type Destination = {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  summary: string;
  description: string;
  hero_image: string;
  highlights: string[];
  published: boolean;
  created_at?: string;
};

export type Tour = {
  id: string;
  slug: string;
  title: string;
  destination_slug: string;
  category: string;
  summary: string;
  description: string;
  hero_image: string;
  gallery: string[];
  duration: string;
  pickup: string | null;
  meeting_point: string | null;
  dropoff: string | null;
  group_size: string | null;
  itinerary: string[];
  included: string[];
  excluded: string[];
  important_info: string[];
  restrictions: string[];
  what_to_bring: string[];
  cancellation_policy: string | null;
  adult_price: number | null;
  child_price: number | null;
  price: number | null;
  currency: string;
  published: boolean;
  created_at?: string;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  destination_slug: string | null;
  summary: string;
  body: string;
  hero_image: string;
  read_time: string;
  published_at: string | null;
  published: boolean;
  created_at?: string;
};

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  destination: string;
  tour: string | null;
  travel_date: string | null;
  travellers: number;
  adults: number;
  children: number;
  tour_option: string | null;
  message: string;
  status: string;
  created_at: string;
};

export type Review = {
  id: string;
  tour_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
};

export type Attraction = {
  id: string;
  destination_slug: string | null;
  name: string;
  description: string;
  image_url: string;
  published: boolean;
  created_at?: string;
};

export type BusinessSettings = {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  address: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  booking_instructions: string;
  updated_at: string;
};

export type View =
  | { name: 'home' }
  | { name: 'destinations' }
  | { name: 'destination'; value: string }
  | { name: 'tours' }
  | { name: 'tour'; value: string }
  | { name: 'stories' }
  | { name: 'article'; value: string }
  | { name: 'contact' }
  | { name: 'admin' }
  | { name: 'admin-login' }
  | { name: 'admin-dashboard' };
