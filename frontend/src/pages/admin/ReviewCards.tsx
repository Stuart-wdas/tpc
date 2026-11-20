import { ArrowUpRight } from 'lucide-react';
import { Status } from '../../components/Feedback';
import type { Event, Venue } from '../../types';
import { formatDate } from '../../utils/date';
import type { ReviewTarget } from './types';

type ReviewAction = (target: ReviewTarget) => void;

export function VenueReviewCard({ venue, onReview }: { venue: Venue; onReview: ReviewAction }) {
  return (
    <article className="review-card">
      <div>
        <Status value={venue.status} />
        <h3>{venue.name}</h3>
        <p>
          {venue.city} · {venue.category}
        </p>
        <p className="muted">
          {venue.owner_name} · {venue.owner_email}
        </p>
      </div>
      <button
        className="button ghost small"
        onClick={() => onReview({ kind: 'venues', record: venue })}
      >
        Review place <ArrowUpRight size={15} />
      </button>
    </article>
  );
}

export function EventReviewCard({ event, onReview }: { event: Event; onReview: ReviewAction }) {
  return (
    <article className="review-card">
      <div>
        <Status value={event.status} />
        <h3>{event.title}</h3>
        <p>
          {event.venue_name} · {event.city}
        </p>
        <p className="muted">
          {formatDate(event.starts_at)} · {event.capacity} places
        </p>
      </div>
      <button
        className="button ghost small"
        onClick={() => onReview({ kind: 'events', record: event })}
      >
        Review gathering <ArrowUpRight size={15} />
      </button>
    </article>
  );
}
