import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, MapPin, Sparkles } from 'lucide-react';
import { icons } from '../../components/CategoryIcons';
import { EventCard } from '../../components/EventCard';
import { useLoad } from '../../hooks/useLoad';
import { type Event } from '../../types';
import { categories, cities } from '../../constants';
import { Loading, ErrorBox } from '../../components/Feedback';

export function Home() {
  const { data, error, loading, reload } = useLoad<Event[]>('/events');
  const navigate = useNavigate();
  const [city, setCity] = useState('Cape Town');
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-dots">
              <i />
              <i />
              <i />
            </span>{' '}
            GOOD PEOPLE. REAL PLACES.
          </p>
          <h1>
            Your people.
            <br />
            Your city.
            <br />
            <em>Your third place.</em>
          </h1>
          <p className="hero-description">
            Somewhere between home and work,
            <br className="desktop-break" /> there’s a place you belong. Let’s find it.
          </p>
          <form
            className="city-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/discover?city=${encodeURIComponent(city)}`);
            }}
          >
            <label htmlFor="hero-city">
              <MapPin size={19} />
              <span>
                <small>LET’S START CLOSE TO HOME</small>
                <select id="hero-city" value={city} onChange={(e) => setCity(e.target.value)}>
                  {cities.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </span>
            </label>
            <button className="button" type="submit">
              Explore gatherings <ArrowUpRight size={18} />
            </button>
          </form>
          <div className="hero-note">
            <span className="mini-faces">
              <b>A</b>
              <b>T</b>
              <b>L</b>
            </span>
            <span>
              Come as you are. <strong>Leave a little more connected.</strong>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="photo-frame">
            <img src="/images/community.jpg" alt="Friends sharing a relaxed meal around a table" />
            <div className="photo-caption">
              <span className="live-dot" /> A table. A conversation. A beginning.
            </div>
          </div>
          <div className="sun-sticker">
            <Sparkles size={25} />
            <span>
              Real life
              <br />
              looks good
              <br />
              on you.
            </span>
          </div>
          <div className="little-note">
            <span className="red-dot" />
            <span>
              Your next “same time next week?”
              <br />
              <strong>starts right here.</strong>
            </span>
            <svg viewBox="0 0 90 50" aria-hidden="true">
              <path d="M4 15Q45 58 82 9M65 13L83 8L79 26" />
            </svg>
          </div>
        </div>
      </section>
      <div className="value-strip">
        <div className="wrap">
          <span>
            <span className="shape red-circle" /> Small groups, easy conversations
          </span>
          <span>
            <span className="shape blue-square" /> Local spots with a little soul
          </span>
          <span>
            <span className="shape yellow-star" /> A reason to put your phone down
          </span>
        </div>
      </div>
      <section className="section wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LESS “WE SHOULD”. MORE “SEE YOU THERE”.</p>
            <h2>Good things are happening.</h2>
          </div>
          <Link className="arrow-link" to="/discover">
            Find your next thing <ArrowRight size={18} />
          </Link>
        </div>
        <div className="category-row">
          {categories.slice(0, 5).map((c, i) => {
            const Icon = icons[i];
            return (
              <Link key={c} to={`/discover?category=${encodeURIComponent(c)}`}>
                <Icon size={17} />
                {c}
              </Link>
            );
          })}
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox error={error} retry={reload} />
        ) : (
          <div className="event-grid">
            {data?.slice(0, 3).map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
        <p className="sample-note">
          A little taste of what’s possible. These are sample gatherings in our development
          community.
        </p>
      </section>
      <section className="how-section">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <p className="eyebrow">NO BIG PLANS REQUIRED</p>
              <h2>A little yes can go a long way.</h2>
            </div>
            <p>
              You don’t need a whole new life.
              <br />
              Just a little more life in your week.
            </p>
          </div>
          <div className="steps">
            <div>
              <span className="step-number blue-text">01</span>
              <h3>Find your kind of thing.</h3>
              <p>
                A coffee walk, a book chat, something you’ve never tried. Follow your curiosity.
              </p>
            </div>
            <div>
              <span className="step-number red-text">02</span>
              <h3>Save yourself a seat.</h3>
              <p>
                Pick a gathering and RSVP. Small groups mean there’s always room to be yourself.
              </p>
            </div>
            <div>
              <span className="step-number yellow-text">03</span>
              <h3>Show up. Feel at home.</h3>
              <p>
                Your local host makes the introductions. The rest? That’s where the good stuff
                happens.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="business-banner wrap">
        <span className="eyebrow">FOR THE PLACES THAT BRING US TOGETHER</span>
        <h2>
          Your space.
          <br />
          Their new favourite place.
        </h2>
        <p>
          Run a café, bookshop, studio or something special?
          <br />
          Let’s fill it with good people and a little possibility.
        </p>
        <Link to="/for-business" className="button blue-button">
          Bring your place to the collective <ArrowUpRight size={18} />
        </Link>
        <span className="banner-symbol" aria-hidden="true">
          ✳
        </span>
      </section>
    </>
  );
}
