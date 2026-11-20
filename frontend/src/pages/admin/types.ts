import { type Venue, type Event } from '../../types';

export type ReviewTarget = { kind: 'venues'; record: Venue } | { kind: 'events'; record: Event };

export type ReviewDecision = 'approved' | 'rejected' | 'cancelled';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  disabled: boolean;
};

export type AdminData = {
  venues: Venue[];
  events: Event[];
  users: AdminUser[];
  stats: { members: number; venues: number; events: number; rsvps: number };
  audit: {
    id: number;
    action: string;
    target_id: string;
    note: string;
    actor_name: string;
    created_at: string;
  }[];
};
