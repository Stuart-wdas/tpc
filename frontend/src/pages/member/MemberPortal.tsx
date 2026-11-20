import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Heart, UserRound, ShieldCheck, Building2 } from 'lucide-react';
import { Plans } from './Plans';
import { Saved } from './Saved';
import { Profile } from './Profile';
import { useApp } from '../../context/AppContext';

export function MemberPortal() {
  const { user } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'plans';
  return (
    <section className="page wrap">
      <p className="eyebrow">YOUR LITTLE CORNER OF THE COLLECTIVE</p>
      <div className="page-heading">
        <div>
          <h1>
            Hello, {user!.name.split(' ')[0]}
            <span className="red-text">.</span>
          </h1>
          <p>Make a little room for the good stuff.</p>
        </div>
        <Link to="/discover" className="button">
          Find a gathering <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="portal-tabs" role="navigation" aria-label="My place sections">
        {[
          ['plans', 'My plans', CalendarDays],
          ['saved', 'Saved gatherings', Heart],
          ['profile', 'My profile', UserRound],
        ].map(([id, label, Icon]) => {
          const I = Icon as typeof Heart;
          return (
            <button
              key={String(id)}
              className={tab === id ? 'selected' : ''}
              onClick={() => setParams({ tab: String(id) })}
            >
              <I size={17} />
              {String(label)}
            </button>
          );
        })}
        {user!.role !== 'member' && (
          <Link to={user!.role === 'admin' ? '/admin' : '/business'}>
            {user!.role === 'admin' ? <ShieldCheck size={17} /> : <Building2 size={17} />}Open{' '}
            {user!.role} portal <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
      {tab === 'saved' ? <Saved /> : tab === 'profile' ? <Profile /> : <Plans />}
    </section>
  );
}
