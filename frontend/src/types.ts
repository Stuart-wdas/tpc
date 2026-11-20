export type User = {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'business' | 'admin';
  city: string;
  interests: string[];
};

export type Event = {
  id: string;
  title: string;
  description: string;
  category: string;
  starts_at: string;
  duration: number;
  capacity: number;
  attendees: number;
  image: string;
  status: string;
  review_note: string;
  venue_id: string;
  venue_name: string;
  venue_description: string;
  city: string;
  address: string;
  booking_id?: string;
  booking_status?: string;
  checked_in?: boolean;
};

export type Venue = {
  id: string;
  name: string;
  description: string;
  city: string;
  address: string;
  category: string;
  website: string;
  status: string;
  review_note: string;
  owner_name?: string;
  owner_email?: string;
};
