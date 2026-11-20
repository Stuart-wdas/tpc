import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function InstallCard() {
  const { installAvailable, install } = useApp();
  return (
    <section className="panel blue-tint">
      <CalendarDays size={23} />
      <h3>A little closer to real life.</h3>
      <p>Add TPC to your home screen to keep your next gathering within reach.</p>
      {installAvailable ? (
        <button className="button blue-button" onClick={install}>
          Install app <ArrowUpRight size={16} />
        </button>
      ) : (
        <p className="fine-print">
          Use your browser’s Install app option. On iPhone, open Safari and choose Share → Add to
          Home Screen.
        </p>
      )}
    </section>
  );
}
