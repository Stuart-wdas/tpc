import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { VenueFields } from './VenueFields';
import { readVenueForm } from './readVenueForm';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { ErrorBox } from '../../components/Feedback';

export function BusinessApply() {
  const { user, refresh, notify } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/business/apply', 'POST', readVenueForm(e.currentTarget));
      await refresh();
      notify('Your place is on its way. We’ll review your application.');
      navigate('/business');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page narrow">
      <p className="eyebrow">LET’S MAKE ROOM FOR COMMUNITY</p>
      <h1>Tell us about your place.</h1>
      <p className="lead">
        A few details, then our team will take a look. Once approved, you can submit gatherings to
        the collective.
      </p>
      {user!.role === 'admin' ? (
        <ErrorBox error="Register with a separate member account to apply as a business." />
      ) : (
        <form className="panel" onSubmit={submit}>
          {error && <ErrorBox error={error} />}
          <VenueFields />
          <label className="checkbox-label">
            <input type="checkbox" required />
            <span>
              I’m authorised to represent this venue and agree to create welcoming, safe gatherings.
            </span>
          </label>
          <button className="button blue-button" disabled={busy}>
            {busy ? 'Sending your application…' : 'Submit my place'}
            <ArrowUpRight size={18} />
          </button>
        </form>
      )}
    </section>
  );
}
