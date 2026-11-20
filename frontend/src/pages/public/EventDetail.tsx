import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  CalendarDays,
  Clock3,
  Users,
  Heart,
  Check,
  ChevronRight,
  Download,
} from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useLoad } from '../../hooks/useLoad';
import { type Event } from '../../types';
import { formatDate, formatTime } from '../../utils/date';
import { Loading, ErrorBox } from '../../components/Feedback';

export function EventDetail() {
  const { id } = useParams();
  const { data: event, error, loading, reload } = useLoad<Event>(`/events/${id}`);
  const { user, notify, savedIds, refreshSaved } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState(false);
  const saved = savedIds.includes(id || '');
  useEffect(() => {
    setBooked(false);
    if (user)
      void api<Event[]>('/bookings')
        .then((events) => setBooked(events.some((e) => e.id === id)))
        .catch(() => {});
  }, [id, user?.id]);
  async function rsvp() {
    if (!user) {
      navigate(`/login?next=/events/${id}`);
      return;
    }
    setBusy(true);
    try {
      await api(`/events/${id}/rsvp`, 'POST', {});
      setBooked(true);
      notify('You’re on the list. See you there!');
      void reload();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error || !event)
    return (
      <div className="page wrap">
        <ErrorBox error={error || 'Gathering not found.'} retry={reload} />
        <Link to="/discover">Explore other gatherings</Link>
      </div>
    );
  const remaining = Math.max(0, event.capacity - event.attendees);
  const active = event.status === 'approved' && new Date(event.starts_at) > new Date();
  function calendar() {
    const start = new Date(event!.starts_at);
    const end = new Date(start.getTime() + event!.duration * 60000);
    const stamp = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');
    const escape = (s: string) =>
      s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const content = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//TPC//Gatherings//EN\r\nBEGIN:VEVENT\r\nUID:${event!.id}@tpc.local\r\nDTSTAMP:${stamp(new Date())}\r\nDTSTART:${stamp(start)}\r\nDTEND:${stamp(end)}\r\nSUMMARY:${escape(event!.title)}\r\nLOCATION:${escape(event!.venue_name + ', ' + event!.address)}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
    const a = document.createElement('a');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar' }));
    a.href = url;
    a.download = 'tpc-gathering.ics';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="page wrap">
      <Link to="/discover" className="breadcrumb">
        Gatherings <ChevronRight size={14} />
        {event.category}
      </Link>
      <div className="detail-image">
        <img src={`/images/${event.image}.jpg`} alt={`${event.category} gathering setting`} />
        <span className="category-label">{event.category}</span>
      </div>
      <div className="detail-layout">
        <article>
          <p className="eyebrow">A LITTLE TIME WELL SPENT</p>
          <h1>{event.title}</h1>
          <p className="venue-line">
            <MapPin size={17} />
            {event.venue_name} · {event.city}
          </p>
          <h2>What’s the plan?</h2>
          <p className="event-description">{event.description}</p>
          <div className="expectations">
            <h3>First time? You’re in good company.</h3>
            <p>
              Come on your own or with a friend. Your host will welcome you and help break the ice.
              There’s no pressure to be anyone but yourself.
            </p>
          </div>
          <h2>Meet your third place.</h2>
          <h3>{event.venue_name}</h3>
          <p>{event.venue_description}</p>
          <p className="venue-line">
            <MapPin size={17} />
            {event.address}, {event.city}
          </p>
          <a
            className="arrow-link"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address + ' ' + event.city)}`}
            target="_blank"
            rel="noreferrer"
          >
            Get directions <ArrowUpRight size={16} />
          </a>
        </article>
        <aside className="booking-panel">
          <p className="eyebrow">A PLACE WITH YOUR NAME ON IT</p>
          <div className="info-row">
            <CalendarDays />
            <div>
              <strong>
                {formatDate(event.starts_at, { weekday: 'long', day: 'numeric', month: 'long' })}
              </strong>
              <span>{formatTime(event.starts_at)} · South Africa time</span>
            </div>
          </div>
          <div className="info-row">
            <Clock3 />
            <div>
              <strong>{event.duration} minutes</strong>
              <span>A little break from the everyday</span>
            </div>
          </div>
          <div className="info-row">
            <Users />
            <div>
              <strong>
                {remaining} of {event.capacity} places available
              </strong>
              <span>Small groups. More connection.</span>
            </div>
          </div>
          <div className="booking-price">
            <h2>Free</h2>
            <span>to reserve your place</span>
          </div>
          {booked && active ? (
            <>
              <div className="success">
                <Check size={20} />
                You’re on the list!
              </div>
              <Link to="/my" className="button full">
                View my plans <ArrowRight size={17} />
              </Link>
              <button className="button ghost full" onClick={calendar}>
                <Download size={16} />
                Add to calendar
              </button>
            </>
          ) : (
            <button className="button full" disabled={busy || !active || !remaining} onClick={rsvp}>
              {busy
                ? 'Saving your seat…'
                : !active
                  ? event.status === 'cancelled'
                    ? 'Gathering cancelled'
                    : 'Gathering has ended'
                  : !remaining
                    ? 'This gathering is full'
                    : 'Count me in'}
              <ArrowUpRight size={18} />
            </button>
          )}
          <button
            className="button ghost full"
            disabled={busy}
            onClick={async () => {
              if (!user) {
                navigate(`/login?next=/events/${id}`);
                return;
              }
              setBusy(true);
              try {
                await api(`/saved/${id}`, saved ? 'DELETE' : 'POST', {});
                await refreshSaved();
                notify(saved ? 'Removed from saved.' : 'Saved for later.');
              } catch (e) {
                notify((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved to my place' : 'Save for later'}
          </button>
          <p className="fine-print">
            Plans change. You can cancel your RSVP in My place. Purchases at the venue are separate.
          </p>
        </aside>
      </div>
    </section>
  );
}
