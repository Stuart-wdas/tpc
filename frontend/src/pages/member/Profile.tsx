import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Building2 } from 'lucide-react';
import { InstallCard } from './InstallCard';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { categories, cities } from '../../constants';
import { ErrorBox } from '../../components/Feedback';

export function Profile() {
  const { user, refresh, notify } = useApp();
  const [interests, setInterests] = useState(user!.interests || []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await api('/me', 'PATCH', { name: f.get('name'), city: f.get('city'), interests });
      await refresh();
      notify('Your profile feels a little more you.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="profile-layout">
      <form className="panel" onSubmit={submit}>
        <h2>A little about you.</h2>
        <p>Your city and interests help you decide where to start.</p>
        {error && <ErrorBox error={error} />}
        <label>
          Your name
          <input name="name" defaultValue={user!.name} required minLength={2} maxLength={100} />
        </label>
        <label>
          Email address
          <input value={user!.email} disabled />
          <small>Contact your administrator to change your email.</small>
        </label>
        <label>
          Your city
          <select name="city" defaultValue={user!.city || 'Cape Town'}>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>What are you curious about?</legend>
          <div className="interest-options">
            {categories.map((c) => (
              <label key={c} className={interests.includes(c) ? 'checked' : ''}>
                <input
                  type="checkbox"
                  checked={interests.includes(c)}
                  onChange={() =>
                    setInterests(
                      interests.includes(c) ? interests.filter((i) => i !== c) : [...interests, c],
                    )
                  }
                />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="button" disabled={busy}>
          {busy ? 'Saving…' : 'Save my profile'}
          <Check size={17} />
        </button>
      </form>
      <div>
        <InstallCard />
        <form
          className="panel"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            setPasswordBusy(true);
            try {
              await api('/auth/change-password', 'POST', {
                currentPassword: f.get('currentPassword'),
                newPassword: f.get('newPassword'),
                revokeOtherSessions: true,
              });
              notify('Password updated.');
              form.reset();
            } catch (e) {
              notify((e as Error).message);
            } finally {
              setPasswordBusy(false);
            }
          }}
        >
          <h3>Keep your account yours.</h3>
          <label>
            Current password
            <input
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              name="newPassword"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </label>
          <button className="button ghost" disabled={passwordBusy}>
            {passwordBusy ? 'Updating…' : 'Update password'}
          </button>
        </form>
        {user!.role === 'member' && (
          <div className="panel blue-tint">
            <Building2 />
            <h3>Have a place to share?</h3>
            <p>Bring your café, studio or community space to the collective.</p>
            <Link className="arrow-link" to="/business/apply">
              Register a business <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
