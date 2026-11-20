import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { ErrorBox } from '../../components/Feedback';
import type { User } from '../../types';
import { getPortalPath } from '../../utils/navigation';

export function AuthPage({ signup = false }: { signup?: boolean }) {
  const { user, refresh } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const business = params.get('type') === 'business';
  const requested = params.get('next');
  const next =
    requested?.startsWith('/') && !requested.startsWith('//')
      ? requested
      : business
        ? '/business/apply'
        : null;
  if (user) return <Navigate replace to={next || getPortalPath(user.role)} />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const formData = new FormData(event.currentTarget);
    try {
      if (signup)
        await api('/auth/sign-up/email', 'POST', {
          name: formData.get('name'),
          username: formData.get('username'),
          email: formData.get('email'),
          password: formData.get('password'),
        });
      else {
        const identifier = String(formData.get('identifier')).trim();
        await api(`/auth/sign-in/${identifier.includes('@') ? 'email' : 'username'}`, 'POST', {
          [identifier.includes('@') ? 'email' : 'username']: identifier,
          password: formData.get('password'),
        });
      }
      const signedInUser = await api<User>('/me');
      await refresh();
      const destination =
        signedInUser.role === 'member' ? '/my?tab=profile' : getPortalPath(signedInUser.role);
      navigate(next || destination);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const suffix = next ? `?next=${encodeURIComponent(next)}` : '';
  return (
    <div className="auth-layout wrap">
      <div className="auth-story">
        <p className="eyebrow">A LITTLE MORE REAL LIFE</p>
        <h1>
          {signup ? (
            <>
              Your next chapter
              <br />
              starts with <em>hello.</em>
            </>
          ) : (
            <>
              Good to have
              <br />
              you <em>back.</em>
            </>
          )}
        </h1>
        <p>
          A few new faces.
          <br />A place that feels like yours.
        </p>
        <img src="/images/community.jpg" alt="Good conversation around a shared table" />
        <span className="auth-sticker">Come as you are.</span>
      </div>
      <section className="auth-form">
        <span className="tiny-dots">
          <i />
          <i />
          <i />
        </span>
        <h2>
          {signup
            ? business
              ? 'Bring your place along.'
              : 'Find your people.'
            : 'Make yourself at home.'}
        </h2>
        <p>
          {signup
            ? 'Create your account. The good stuff is waiting.'
            : 'Sign in to save a seat and see what’s next.'}
        </p>
        {error && <ErrorBox error={error} />}
        <form onSubmit={submit}>
          {signup ? (
            <>
              <label>
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="e.g. Alex Morgan"
                />
              </label>
              <label>
                Username
                <input
                  name="username"
                  autoComplete="username"
                  pattern="[a-zA-Z0-9_.]{3,30}"
                  title="3–30 letters, numbers, underscores or dots"
                  required
                  placeholder="Your unique username"
                />
              </label>
              <label>
                Email address
                <input
                  name="email"
                  autoComplete="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                />
              </label>
            </>
          ) : (
            <label>
              Email or username
              <input
                name="identifier"
                autoComplete="username"
                required
                placeholder="Your email or username"
              />
            </label>
          )}
          <label>
            Password
            <div className="password-field">
              <input
                aria-label="Password"
                name="password"
                autoComplete={signup ? 'new-password' : 'current-password'}
                type={show ? 'text' : 'password'}
                required
                minLength={signup ? 8 : 1}
                maxLength={128}
                placeholder={signup ? 'At least 8 characters' : 'Your password'}
              />
              <button type="button" className="text-button" onClick={() => setShow(!show)}>
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          {signup && (
            <label className="checkbox-label">
              <input type="checkbox" required />
              <span>
                I agree to the <Link to="/privacy">privacy notice and community guidelines</Link>.
              </span>
            </label>
          )}
          <button type="submit" className="button full" disabled={busy}>
            {busy ? 'One moment…' : signup ? 'Let’s get started' : 'Log in'}
            <ArrowUpRight size={18} />
          </button>
        </form>
        <p className="auth-switch">
          {signup ? 'Already part of the collective?' : 'New around here?'}{' '}
          <Link to={`${signup ? '/login' : '/signup'}${suffix}`}>
            {signup ? 'Log in' : 'Join the collective'}
          </Link>
        </p>
        {!signup && (
          <p className="fine-print">
            Forgot your password? Contact the TPC administrator through the team that invited you.
            Email recovery is not configured for this local release.
          </p>
        )}
      </section>
    </div>
  );
}
