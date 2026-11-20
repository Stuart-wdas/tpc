import { cities } from '../../constants';
import { type Venue } from '../../types';

export function VenueFields({ venue }: { venue?: Venue }) {
  return (
    <>
      <div className="form-grid">
        <label>
          Venue name
          <input
            name="name"
            defaultValue={venue?.name}
            required
            minLength={2}
            maxLength={100}
            placeholder="e.g. The Corner Café"
          />
        </label>
        <label>
          Type of place
          <select name="category" defaultValue={venue?.category || 'Café'}>
            {[
              'Café',
              'Bookshop',
              'Studio',
              'Gallery',
              'Community space',
              'Restaurant',
              'Other',
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          City
          <select name="city" defaultValue={venue?.city || 'Cape Town'}>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Street address
          <input
            name="address"
            defaultValue={venue?.address}
            required
            minLength={5}
            maxLength={200}
            placeholder="Street number, street and neighbourhood"
          />
        </label>
      </div>
      <label>
        Tell us about your place
        <textarea
          name="description"
          defaultValue={venue?.description}
          required
          minLength={20}
          maxLength={2000}
          rows={4}
          placeholder="What makes your space special, and how would you welcome a small gathering?"
        />
      </label>
      <label>
        Website or social profile <span className="muted">(optional)</span>
        <input name="website" type="url" defaultValue={venue?.website} placeholder="https://…" />
      </label>
    </>
  );
}
