import { api } from '../../api/client';
import { ConfirmButton } from '../../components/ConfirmButton';
import { Status } from '../../components/Feedback';
import { useApp } from '../../context/AppContext';
import type { AdminUser } from './types';

export function PeopleTable({
  people,
  onUpdated,
}: {
  people: AdminUser[];
  onUpdated: () => Promise<void>;
}) {
  const { user, notify } = useApp();

  async function toggleAccess(person: AdminUser) {
    await api(`/admin/users/${person.id}`, 'PATCH', { disabled: !person.disabled });
    notify(person.disabled ? 'Account enabled.' : 'Account disabled and sessions revoked.');
    await onUpdated();
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Person</th>
            <th>Role</th>
            <th>Access</th>
            <th>Manage</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id}>
              <td>
                <strong>{person.name}</strong>
                <small>
                  {person.email} · @{person.username}
                </small>
              </td>
              <td>
                <Status value={person.role} />
              </td>
              <td>
                <Status value={person.disabled ? 'disabled' : 'active'} />
              </td>
              <td>
                {person.id === user!.id ? (
                  <span className="muted">Your account</span>
                ) : (
                  <ConfirmButton onConfirm={() => toggleAccess(person)}>
                    {person.disabled ? 'Enable account' : 'Disable account'}
                  </ConfirmButton>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
