import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, MapPin, Users, Heart } from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { type Event } from '../types';
import { formatDate, formatTime } from '../utils/date';

export function EventCard({
  event,
  saved = false,
  onSave,
}: {
  event: Event;
  saved?: boolean;
  onSave?: () => void;
}) {
  const { user, notify, savedIds, refreshSaved } = useApp();
  const navigate = useNavigate();
  const isSaved = savedIds.includes(event.id);
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent('/events/' + event.id)}`);
      return;
    }
    setBusy(true);
    try {
      await api(`/saved/${event.id}`, isSaved ? 'DELETE' : 'POST', {});
      await refreshSaved();
      notify(isSaved ? 'Removed from your saved gatherings.' : 'Saved for another day.');
      onSave?.();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="event-card">
      <div className="event-photo">
        <Link to={`/events/${event.id}`} tabIndex={-1} aria-hidden="true">
          <img loading="lazy" src={`/images/${event.image}.jpg`} alt="" />
        </Link>
        <span className={`category-label ${event.image}`}>{event.category}</span>
        <button
          className={`save-button ${isSaved ? 'selected' : ''}`}
          aria-label={isSaved ? `Unsave ${event.title}` : `Save ${event.title}`}
          aria-pressed={isSaved}
          disabled={busy}
          onClick={save}
        >
          <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="event-info">
        <p className="event-date">
          {formatDate(event.starts_at)} <span>·</span> {formatTime(event.starts_at)}
        </p>
        <h3>
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h3>
        <p className="venue-line">
          <MapPin size={14} />
          {event.venue_name} · {event.city}
        </p>
        <div className="event-bottom">
          <span>
            <Users size={14} />
            {Math.max(0, event.capacity - event.attendees)} places left
          </span>
          <span>
            Free to join <ArrowUpRight size={15} />
          </span>
        </div>
      </div>
    </article>
  );
}
