import { formatDate } from '../../utils/date';
import type { AdminData } from './types';

export function ActivityLog({ entries }: { entries: AdminData['audit'] }) {
  return (
    <div className="panel">
      <h2>Recent admin activity</h2>
      {entries.length ? (
        <ol className="audit-list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <span className="activity-dot" />
              <div>
                <strong>
                  {entry.actor_name} {entry.action}
                </strong>
                <p>{entry.note || entry.target_id}</p>
                <small>
                  {formatDate(entry.created_at, {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </small>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">Reviews and account access changes will be recorded here.</p>
      )}
    </div>
  );
}
