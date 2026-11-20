import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import { useLoad } from '../../hooks/useLoad';
import { type Event } from '../../types';
import { Loading, ErrorBox } from '../../components/Feedback';
import { EventCard } from '../../components/EventCard';

export function Saved() {
  const { data, error, loading, reload } = useLoad<Event[]>('/saved');
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} retry={reload} />;
  return data?.length ? (
    <div className="event-grid">
      {data.map((e) => (
        <EventCard key={e.id} event={e} saved onSave={reload} />
      ))}
    </div>
  ) : (
    <div className="empty">
      <Heart size={36} />
      <h2>A few possibilities for later.</h2>
      <p>Tap the heart on any gathering to keep it here.</p>
      <Link className="button" to="/discover">
        Find something good <ArrowRight size={18} />
      </Link>
    </div>
  );
}
