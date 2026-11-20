import { useState, type FormEvent } from 'react';
import { ArrowUpRight, ArrowLeft } from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { categories } from '../../constants';
import { type Event, type Venue } from '../../types';
import { ErrorBox } from '../../components/Feedback';

export function EventForm({
  venues,
  event,
  onClose,
  onSaved,
}: {
  venues: Venue[];
  event: Event | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [venueId, setVenueId] = useState(event?.venue_id || venues[0]?.id);
  const { notify } = useApp();
  const approved = venues.find((v) => v.id === venueId)?.status === 'approved';
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const intent = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') || 'draft';
    setBusy(true);
    setError('');
    try {
      await api(
        event ? `/business/events/${event.id}` : '/business/events',
        event ? 'PATCH' : 'POST',
        {
          ...data,
          starts_at: new Date(String(data.starts_at) + '+02:00').toISOString(),
          capacity: Number(data.capacity),
          duration: Number(data.duration),
          status: intent,
        },
      );
      notify(
        intent === 'pending' ? 'Gathering submitted for review.' : 'Draft saved. A good beginning.',
      );
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  // datetime-local is presented consistently in South Africa time, independent of the host machine.
  const date = event
    ? new Date(new Date(event.starts_at).getTime() + 7200000).toISOString().slice(0, 16)
    : '';
  return (
    <form className="panel event-form" onSubmit={submit}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">MAKE A LITTLE PLAN</p>
          <h2>{event ? 'Shape your gathering.' : 'What will bring people together?'}</h2>
        </div>
        <button type="button" className="text-button" onClick={onClose}>
          <ArrowLeft size={16} />
          Back to gatherings
        </button>
      </div>
      {error && <ErrorBox error={error} />}
      <label>
        Gathering title
        <input
          name="title"
          defaultValue={event?.title}
          required
          minLength={5}
          maxLength={120}
          placeholder="e.g. Coffee, conversation and a little fresh air"
        />
      </label>
      <div className="form-grid">
        <label>
          At which place?
          <select name="venue_id" value={venueId} onChange={(e) => setVenueId(e.target.value)}>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.status})
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select name="category" defaultValue={event?.category || categories[0]}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Date and start time (South Africa)
          <input name="starts_at" type="datetime-local" required defaultValue={date} />
        </label>
        <label>
          Duration in minutes
          <input
            name="duration"
            type="number"
            min={15}
            max={1440}
            defaultValue={event?.duration || 90}
            required
          />
        </label>
        <label>
          Group capacity
          <input
            name="capacity"
            type="number"
            min={1}
            max={1000}
            defaultValue={event?.capacity || 12}
            required
          />
        </label>
        <label>
          Cover photo
          <select name="image" defaultValue={event?.image || 'coffee'}>
            {['coffee', 'books', 'clay', 'dinner', 'garden', 'music'].map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        What’s the plan?
        <textarea
          name="description"
          defaultValue={event?.description}
          rows={6}
          required
          minLength={30}
          maxLength={5000}
          placeholder="Tell people what to expect, what to bring and how you’ll welcome them."
        />
      </label>
      <p className="fine-print">
        This first release supports free RSVPs. Let members know about any optional purchases at
        your venue.
      </p>
      <div className="form-actions">
        <button type="submit" value="draft" disabled={busy} className="button ghost">
          {busy ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="submit"
          value="pending"
          disabled={busy || !approved}
          className="button blue-button"
        >
          Submit for review <ArrowUpRight size={17} />
        </button>
      </div>
      {!approved && (
        <p className="fine-print">
          Your venue needs approval before you can submit this event. You can save a draft now.
        </p>
      )}
    </form>
  );
}
