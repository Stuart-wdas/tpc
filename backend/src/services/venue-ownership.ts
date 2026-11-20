import type { Pool } from 'pg';
import type { CurrentUser } from '../http/authentication';
import { fail } from '../http/errors';
export function createVenueOwnershipCheck(pool: Pool) {
  const requireVenueOwner = async (venueId: string, user: CurrentUser) => {
    const venue = (await pool.query('SELECT * FROM venues WHERE id=$1', [venueId])).rows[0];
    if (!venue) fail(404, 'Venue not found.');
    if (venue.owner_id !== user.id) fail(403, 'You can only manage your own venue.');
    return venue;
  };

  return requireVenueOwner;
}
