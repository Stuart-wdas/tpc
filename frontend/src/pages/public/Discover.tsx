import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, MapPin, CalendarDays, Search } from 'lucide-react';
import { icons } from '../../components/CategoryIcons';
import { EventCard } from '../../components/EventCard';
import { useLoad } from '../../hooks/useLoad';
import { type Event } from '../../types';
import { categories, cities } from '../../constants';
import { Loading, ErrorBox } from '../../components/Feedback';

export function Discover() {
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const { data, error, loading, reload } = useLoad<Event[]>(`/events?${query}`);
  const [q, setQ] = useState(params.get('q') || '');
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  return (
    <section className="page wrap">
      <p className="eyebrow">YOUR NEXT LITTLE ADVENTURE</p>
      <div className="page-heading">
        <div>
          <h1>Find your kind of people.</h1>
          <p>Good company is closer than you think.</p>
        </div>
        <span className="handwritten">
          Go on. Say yes. <ArrowUpRight />
        </span>
      </div>
      <div className="discovery-filters">
        <form
          className="search-input"
          onSubmit={(e) => {
            e.preventDefault();
            filter('q', q);
          }}
        >
          <Search size={19} />
          <label className="sr-only" htmlFor="event-search">
            Search gatherings
          </label>
          <input
            id="event-search"
            placeholder="Try coffee, books, a new beginning…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="text-button" type="submit">
            Search
          </button>
        </form>
        <label className="select-filter">
          <MapPin size={17} />
          <span className="sr-only">City</span>
          <select value={params.get('city') || ''} onChange={(e) => filter('city', e.target.value)}>
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="select-filter">
          <CalendarDays size={17} />
          <span className="sr-only">When</span>
          <select value={params.get('when') || ''} onChange={(e) => filter('when', e.target.value)}>
            <option value="">Any time</option>
            <option value="week">Next 7 days</option>
            <option value="weekend">Weekends</option>
          </select>
        </label>
      </div>
      <div className="category-row filter-categories">
        <button
          className={!params.get('category') ? 'selected' : ''}
          onClick={() => filter('category', '')}
        >
          All the good things
        </button>
        {categories.map((c, i) => {
          const Icon = icons[i];
          return (
            <button
              key={c}
              className={params.get('category') === c ? 'selected' : ''}
              onClick={() => filter('category', c)}
            >
              <Icon size={16} />
              {c}
            </button>
          );
        })}
      </div>
      <div className="results-line">
        <span>
          {loading ? 'Looking around…' : `${data?.length || 0} gatherings to make room for`}
        </span>
        {query && (
          <button
            className="text-button"
            onClick={() => {
              setParams({});
              setQ('');
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox error={error} retry={reload} />
      ) : data?.length ? (
        <div className="event-grid">
          {data.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Search size={32} />
          <h3>No gatherings here just yet.</h3>
          <p>Try another city, interest or date. Your next good thing is out there.</p>
          <button
            className="button"
            onClick={() => {
              setParams({});
              setQ('');
            }}
          >
            See all gatherings
          </button>
        </div>
      )}
    </section>
  );
}
