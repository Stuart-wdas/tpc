import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Loading } from './Feedback';

export function RequireAccount({ role }: { role?: string }) {
  const { user, loading } = useApp();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (role && user.role !== role)
    return (
      <div className="page narrow">
        <p className="eyebrow">A different door</p>
        <h1>This portal is for {role === 'admin' ? 'administrators' : 'businesses'}.</h1>
        <p>
          You are signed in as {user.name}. Your account has {user.role} access.
        </p>
        <Link className="button" to="/my">
          Go to my place <ArrowRight size={16} />
        </Link>
      </div>
    );
  return <Outlet />;
}
