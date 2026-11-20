import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Menu,
  X,
  Heart,
  LogOut,
  Compass,
  CalendarDays,
  Building2,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Brand } from './Brand';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

export function Layout() {
  const { user, refresh } = useApp();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className={open ? 'main-nav open' : 'main-nav'} aria-label="Main navigation">
            <Link className={location.pathname === '/discover' ? 'active' : ''} to="/discover">
              Find a gathering
            </Link>
            <Link to="/about">Our story</Link>
            <Link to="/for-business">
              For local places <ArrowUpRight size={14} />
            </Link>
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <Link
                  className="button ghost compact"
                  to={
                    user.role === 'admin'
                      ? '/admin'
                      : user.role === 'business'
                        ? '/business'
                        : '/my'
                  }
                >
                  <UserRound size={16} />
                  <span>My {user.role === 'member' ? 'place' : 'portal'}</span>
                </Link>
                <button
                  className="icon-button"
                  title="Sign out"
                  aria-label="Sign out"
                  onClick={async () => {
                    await api('/auth/sign-out', 'POST', {});
                    await refresh();
                    navigate('/');
                  }}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link className="login-link" to="/login">
                  Log in
                </Link>
                <Link className="button compact" to="/signup">
                  Find your people <ArrowUpRight size={16} />
                </Link>
              </>
            )}
            <button
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="icon-button mobile-menu"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer>
        <div className="footer-top">
          <Brand />
          <p>
            Less scrolling.
            <br />
            More showing up.
          </p>
          <div>
            <Link to="/discover">Explore gatherings</Link>
            <Link to="/for-business">Become a local place</Link>
            <Link to="/about">Meet the collective</Link>
            <Link to="/admin">Admin portal</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} The Third Place Collective</span>
          <span>Made for real life. Rooted in South Africa.</span>
          <Link to="/privacy">Privacy & community guidelines</Link>
        </div>
      </footer>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <Link to="/discover">
          <Compass size={20} />
          Discover
        </Link>
        <Link to="/my">
          <CalendarDays size={20} />
          My plans
        </Link>
        <Link to="/my?tab=saved">
          <Heart size={20} />
          Saved
        </Link>
        <Link
          to={
            user?.role === 'business'
              ? '/business'
              : user?.role === 'admin'
                ? '/admin'
                : '/my?tab=profile'
          }
        >
          {user?.role === 'business' ? (
            <Building2 size={20} />
          ) : user?.role === 'admin' ? (
            <ShieldCheck size={20} />
          ) : (
            <UserRound size={20} />
          )}
          My place
        </Link>
      </nav>
    </>
  );
}
