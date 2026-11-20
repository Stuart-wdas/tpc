import { useState } from 'react';
import { ArrowLeft, Users, Check } from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useLoad } from '../../hooks/useLoad';
import { type Event } from '../../types';
import { Loading, ErrorBox } from '../../components/Feedback';
import { formatDate, formatTime } from '../../utils/date';

export function Attendees({ event, onClose }: { event: Event; onClose: () => void }) {
  const { data, error, loading, reload } = useLoad<
    { id: string; name: string; checked_in: boolean }[]
  >(`/business/events/${event.id}/attendees`);
  const { notify } = useApp();
  const [busy, setBusy] = useState('');
  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">A WARM WELCOME STARTS HERE</p>
          <h2>{event.title}</h2>
          <p>
            {formatDate(event.starts_at)} · {formatTime(event.starts_at)} ·{' '}
            {data?.filter((a) => a.checked_in).length || 0} checked in
          </p>
        </div>
        <button className="text-button" onClick={onClose}>
          <ArrowLeft size={16} />
          Back
        </button>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox error={error} retry={reload} />
      ) : data?.length ? (
        <div className="guest-list">
          {data.map((a) => (
            <div key={a.id}>
              <span className="avatar">{a.name.charAt(0)}</span>
              <strong>{a.name}</strong>
              <button
                className={`button small ${a.checked_in ? 'ghost' : 'blue-button'}`}
                disabled={!!busy || event.status === 'cancelled'}
                onClick={async () => {
                  setBusy(a.id);
                  try {
                    await api(`/business/attendees/${a.id}`, 'PATCH', {
                      checked_in: !a.checked_in,
                    });
                    await reload();
                  } catch (e) {
                    notify((e as Error).message);
                  } finally {
                    setBusy('');
                  }
                }}
              >
                {busy === a.id ? (
                  'Updating…'
                ) : a.checked_in ? (
                  <>
                    <Check size={16} />
                    Checked in · undo
                  </>
                ) : (
                  'Check in'
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <Users />
          <h3>Your guest list is growing soon.</h3>
          <p>Confirmed RSVPs will appear here.</p>
        </div>
      )}
    </div>
  );
}
