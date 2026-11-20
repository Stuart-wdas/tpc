import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useLoad } from '../../hooks/useLoad';
import { type Event } from '../../types';
import { Loading, ErrorBox, Status } from '../../components/Feedback';
import { ConfirmButton } from '../../components/ConfirmButton';
import { formatDate, formatTime } from '../../utils/date';

export function Plans() {
  const { data, error, loading, reload } = useLoad<Event[]>('/bookings');
  const { notify } = useApp();
  const [history, setHistory] = useState(false);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} retry={reload} />;
  const list =
    data?.filter((e) =>
      history ? new Date(e.starts_at) <= new Date() : new Date(e.starts_at) > new Date(),
    ) || [];
  return (
    <>
      <div className="results-line">
        <h2>{history ? 'A little look back.' : 'Things to look forward to.'}</h2>
        <button className="text-button" onClick={() => setHistory(!history)}>
          {history ? 'See upcoming plans' : 'See past gatherings'}
        </button>
      </div>
      {list.length ? (
        <div className="plans-list">
          {list.map((e) => (
            <article key={e.booking_id} className="plan-card">
              <img src={`/images/${e.image}.jpg`} alt="" />
              <div>
                <p className="event-date">
                  {formatDate(e.starts_at)} · {formatTime(e.starts_at)}
                </p>
                <h3>
                  <Link to={`/events/${e.id}`}>{e.title}</Link>
                </h3>
                <p className="venue-line">
                  <MapPin size={15} />
                  {e.venue_name} · {e.city}
                </p>
                <Status
                  value={
                    e.status === 'cancelled'
                      ? 'cancelled'
                      : e.checked_in
                        ? 'checked in'
                        : 'confirmed'
                  }
                />
                {e.status === 'cancelled' && (
                  <p className="red-text">The host has cancelled this gathering.</p>
                )}
                <p className="fine-print">Reservation {e.booking_id?.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="plan-actions">
                <Link className="button ghost small" to={`/events/${e.id}`}>
                  View gathering <ArrowUpRight size={15} />
                </Link>
                {!history && (
                  <ConfirmButton
                    onConfirm={async () => {
                      await api(`/bookings/${e.booking_id}`, 'DELETE', {});
                      notify('Your RSVP has been cancelled.');
                      await reload();
                    }}
                  >
                    Cancel RSVP
                  </ConfirmButton>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <CalendarDays size={36} />
          <h3>{history ? 'Your story is just beginning.' : 'Your calendar has a little room.'}</h3>
          <p>Find a gathering that feels like you. We’ll save you a seat.</p>
          <Link className="button" to="/discover">
            Explore gatherings <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </>
  );
}
