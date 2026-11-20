import { Check } from 'lucide-react';
import type { Event, Venue } from '../../types';
import { EventReviewCard, VenueReviewCard } from './ReviewCards';
import type { ReviewTarget } from './types';

type ReviewQueueProps = {
  venues: Venue[];
  events: Event[];
  onReview: (target: ReviewTarget) => void;
};

export function ReviewQueue({ venues, events, onReview }: ReviewQueueProps) {
  const pendingCount = venues.length + events.length;
  return (
    <>
      <div className="section-heading">
        <h2>A little attention goes a long way.</h2>
        <span className="muted">{pendingCount} awaiting review</span>
      </div>
      {pendingCount === 0 ? (
        <div className="empty">
          <Check size={36} />
          <h3>You’re all caught up.</h3>
          <p>New venue applications and gathering submissions will appear here.</p>
        </div>
      ) : (
        <>
          <h3>Local places</h3>
          {venues.length ? (
            venues.map((venue) => (
              <VenueReviewCard key={venue.id} venue={venue} onReview={onReview} />
            ))
          ) : (
            <p className="muted">No places awaiting review.</p>
          )}
          <h3 className="mt">Gatherings</h3>
          {events.length ? (
            events.map((event) => (
              <EventReviewCard key={event.id} event={event} onReview={onReview} />
            ))
          ) : (
            <p className="muted">No gatherings awaiting review.</p>
          )}
        </>
      )}
    </>
  );
}
