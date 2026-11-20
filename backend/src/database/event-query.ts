export const eventSelectSql = `
  SELECT
    e.*,
    v.name AS venue_name,
    v.city,
    v.address,
    v.description AS venue_description,
    v.owner_id,
    (
      SELECT count(*)::int
      FROM bookings b
      WHERE b.event_id = e.id AND b.status = 'confirmed'
    ) AS attendees
  FROM events e
  JOIN venues v ON v.id = e.venue_id
`;
