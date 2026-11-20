import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  History,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { ErrorBox, Loading } from '../../components/Feedback';
import { StatCard } from '../../components/StatCard';
import { useApp } from '../../context/AppContext';
import { useLoad } from '../../hooks/useLoad';
import { ActivityLog } from './ActivityLog';
import { PeopleTable } from './PeopleTable';
import { EventReviewCard, VenueReviewCard } from './ReviewCards';
import { ReviewDialog } from './ReviewDialog';
import { ReviewQueue } from './ReviewQueue';
import type { AdminData, ReviewTarget } from './types';

type AdminTab = 'review' | 'venues' | 'events' | 'users' | 'audit';

const tabs = [
  { id: 'review', label: 'Review queue', icon: ShieldCheck },
  { id: 'venues', label: 'Local places', icon: Building2 },
  { id: 'events', label: 'Gatherings', icon: CalendarDays },
  { id: 'users', label: 'People', icon: Users },
  { id: 'audit', label: 'Activity', icon: History },
] as const;

const statistics = [
  { key: 'members', label: 'ACCOUNTS', description: 'Across the collective' },
  { key: 'venues', label: 'APPROVED PLACES', description: 'Welcoming the neighbourhood' },
  { key: 'events', label: 'UPCOMING GATHERINGS', description: 'Ready to bring people together' },
  { key: 'rsvps', label: 'CONFIRMED RSVPS', description: 'Seats saved, connections ahead' },
] as const;

export function AdminPortal() {
  const { data, error, loading, reload } = useLoad<AdminData>('/admin');
  const { user } = useApp();
  const [tab, setTab] = useState<AdminTab>('review');
  const [search, setSearch] = useState('');
  const [review, setReview] = useState<ReviewTarget | null>(null);
  const closeReview = useCallback(() => setReview(null), []);

  async function finishReview() {
    closeReview();
    await reload();
  }

  if (loading && !data) return <Loading />;
  if (error)
    return (
      <div className="page wrap">
        <ErrorBox error={error} retry={reload} />
      </div>
    );
  if (!data) return null;

  const pendingVenues = data.venues.filter((venue) => venue.status === 'pending');
  const pendingEvents = data.events.filter((event) => event.status === 'pending');
  const pendingCount = pendingVenues.length + pendingEvents.length;
  const matchesSearch = (text: string) => text.toLowerCase().includes(search.toLowerCase());

  return (
    <section className="page wrap">
      <p className="eyebrow">
        <ShieldCheck size={15} /> THE COLLECTIVE · ADMIN PORTAL
      </p>
      <div className="page-heading">
        <div>
          <h1>Keep the good things going.</h1>
          <p>A little care behind every connection.</p>
        </div>
        <span className="admin-badge">
          <ShieldCheck size={17} />
          {user!.name}
        </span>
      </div>
      <div className="stats-grid">
        {statistics.map((statistic) => (
          <StatCard
            key={statistic.key}
            value={data.stats[statistic.key]}
            label={statistic.label}
            description={statistic.description}
          />
        ))}
      </div>
      <div className="portal-tabs">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={tab === id ? 'selected' : ''}
            onClick={() => {
              setTab(id);
              setSearch('');
            }}
          >
            <Icon size={17} />
            {label}
            {id === 'review' ? ` (${pendingCount})` : ''}
          </button>
        ))}
        <Link to="/my?tab=profile">
          My account <ArrowUpRight size={15} />
        </Link>
      </div>
      {tab !== 'review' && tab !== 'audit' && (
        <label className="search-input admin-search">
          <Search size={17} />
          <span className="sr-only">Search {tab}</span>
          <input
            placeholder={`Search ${tab}…`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      )}
      {tab === 'review' && (
        <ReviewQueue venues={pendingVenues} events={pendingEvents} onReview={setReview} />
      )}
      {tab === 'venues' &&
        data.venues
          .filter((venue) => matchesSearch(`${venue.name} ${venue.city}`))
          .map((venue) => <VenueReviewCard key={venue.id} venue={venue} onReview={setReview} />)}
      {tab === 'events' &&
        data.events
          .filter((event) => matchesSearch(`${event.title} ${event.venue_name}`))
          .map((event) => <EventReviewCard key={event.id} event={event} onReview={setReview} />)}
      {tab === 'users' && (
        <PeopleTable
          people={data.users.filter((person) =>
            matchesSearch(`${person.name} ${person.email} ${person.username}`),
          )}
          onUpdated={reload}
        />
      )}
      {tab === 'audit' && <ActivityLog entries={data.audit} />}
      {review && <ReviewDialog target={review} onClose={closeReview} onReviewed={finishReview} />}
    </section>
  );
}
