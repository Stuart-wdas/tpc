import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus, Building2, CalendarDays, Users, Pencil, MapPin } from 'lucide-react';
import { type BusinessData } from './types';
import { VenueFields } from './VenueFields';
import { readVenueForm } from './readVenueForm';
import { EventForm } from './EventForm';
import { Attendees } from './Attendees';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useLoad } from '../../hooks/useLoad';
import { type Event, type Venue } from '../../types';
import { Loading, ErrorBox, Status } from '../../components/Feedback';
import { ConfirmButton } from '../../components/ConfirmButton';
import { formatDate, formatTime } from '../../utils/date';

export function BusinessPortal() {
  const { data, error, loading, reload } = useLoad<BusinessData>('/business');
  const { user, notify } = useApp();
  const [tab, setTab] = useState('events');
  const [editing, setEditing] = useState<Event | null | undefined>();
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [attendees, setAttendees] = useState<Event | null>(null);
  if (loading && !data) return <Loading />;
  if (error)
    return (
      <div className="page wrap">
        <ErrorBox error={error} retry={reload} />
      </div>
    );
  if (!data) return null;
  return (
    <section className="page wrap">
      <p className="eyebrow">BUSINESS PORTAL · THE COLLECTIVE STARTS WITH YOU</p>
      <div className="page-heading">
        <div>
          <h1>Your place. More possibility.</h1>
          <p>Welcome back, {user!.name.split(' ')[0]}. Let’s bring people together.</p>
        </div>
        <button
          className="button blue-button"
          onClick={() => setEditing(null)}
          disabled={!data.venues.length}
        >
          <Plus size={18} />
          Create a gathering
        </button>
      </div>
      <div className="stats-grid three">
        <div>
          <span>YOUR LOCAL PLACES</span>
          <strong>{data.venues.length}</strong>
          <small>{data.venues.filter((v) => v.status === 'approved').length} approved</small>
        </div>
        <div>
          <span>UPCOMING GATHERINGS</span>
          <strong>
            {
              data.events.filter(
                (e) => e.status === 'approved' && new Date(e.starts_at) > new Date(),
              ).length
            }
          </strong>
          <small>A reason to come together</small>
        </div>
        <div>
          <span>CONFIRMED RSVPS</span>
          <strong>
            {data.events
              .filter((e) => e.status === 'approved' && new Date(e.starts_at) > new Date())
              .reduce((n, e) => n + e.attendees, 0)}
          </strong>
          <small>Across upcoming gatherings</small>
        </div>
      </div>
      {data.venues.some((v) => v.status === 'pending') && (
        <div className="notice">
          <Building2 size={20} />
          <p>
            <strong>Your venue application is being reviewed.</strong> You can prepare event drafts
            while you wait. Submitting an event requires an approved venue.
          </p>
        </div>
      )}
      <div className="portal-tabs">
        <button className={tab === 'events' ? 'selected' : ''} onClick={() => setTab('events')}>
          <CalendarDays size={17} />
          My gatherings
        </button>
        <button className={tab === 'venues' ? 'selected' : ''} onClick={() => setTab('venues')}>
          <Building2 size={17} />
          My places
        </button>
        <Link to="/my">
          My member profile <ArrowUpRight size={16} />
        </Link>
      </div>
      {editing !== undefined ? (
        <EventForm
          venues={data.venues}
          event={editing}
          onClose={() => setEditing(undefined)}
          onSaved={async () => {
            setEditing(undefined);
            await reload();
          }}
        />
      ) : editVenue ? (
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const button = form.querySelector('button[type=submit]') as HTMLButtonElement;
            button.disabled = true;
            try {
              await api(`/business/venues/${editVenue.id}`, 'PATCH', readVenueForm(form));
              notify('Venue updated and sent for review.');
              setEditVenue(null);
              await reload();
            } catch (e) {
              notify((e as Error).message);
              button.disabled = false;
            }
          }}
        >
          <div className="section-heading">
            <h2>Edit your place</h2>
            <button type="button" className="text-button" onClick={() => setEditVenue(null)}>
              Close
            </button>
          </div>
          <p>
            Editing your venue sends it back for review. Its events are hidden until the venue is
            approved again.
          </p>
          <VenueFields venue={editVenue} />
          <button type="submit" className="button">
            Save and resubmit
          </button>
        </form>
      ) : attendees ? (
        <Attendees event={attendees} onClose={() => setAttendees(null)} />
      ) : tab === 'venues' ? (
        <div className="venue-grid">
          {data.venues.map((v) => (
            <article className="panel" key={v.id}>
              <Status value={v.status} />
              <h2>{v.name}</h2>
              <p className="venue-line">
                <MapPin size={16} />
                {v.address}, {v.city}
              </p>
              <p>{v.description}</p>
              {v.review_note && <div className="notice">Review note: {v.review_note}</div>}
              <button className="button ghost small" onClick={() => setEditVenue(v)}>
                <Pencil size={15} />
                Edit venue
              </button>
            </article>
          ))}
          <Link className="add-venue" to="/business/apply">
            <Plus size={26} />
            Add another place
          </Link>
        </div>
      ) : data.events.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Gathering</th>
                <th>When</th>
                <th>RSVPs</th>
                <th>Status</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.title}</strong>
                    <small>{e.venue_name}</small>
                    {e.review_note && <small className="red-text">{e.review_note}</small>}
                  </td>
                  <td>
                    {formatDate(e.starts_at)}
                    <small>{formatTime(e.starts_at)}</small>
                  </td>
                  <td>
                    {e.attendees} / {e.capacity}
                  </td>
                  <td>
                    <Status value={e.status} />
                  </td>
                  <td>
                    <div className="table-actions">
                      {['draft', 'rejected'].includes(e.status) && (
                        <button className="button ghost small" onClick={() => setEditing(e)}>
                          Edit / submit
                        </button>
                      )}
                      {['approved', 'cancelled'].includes(e.status) && (
                        <button className="button ghost small" onClick={() => setAttendees(e)}>
                          <Users size={15} />
                          Guest list
                        </button>
                      )}
                      {e.status !== 'cancelled' && (
                        <ConfirmButton
                          onConfirm={async () => {
                            await api(`/business/events/${e.id}/cancel`, 'POST', {});
                            notify('Gathering cancelled. It will be marked in members’ plans.');
                            await reload();
                          }}
                        >
                          Cancel
                        </ConfirmButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <CalendarDays size={36} />
          <h2>Your first gathering starts here.</h2>
          <p>Something simple is a good place to begin.</p>
          <button className="button" onClick={() => setEditing(null)}>
            Create a gathering <Plus size={17} />
          </button>
        </div>
      )}
    </section>
  );
}
