import { Link } from 'react-router-dom';

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="The Third Place Collective home">
      <span className="brand-mark">
        <i />
        <i />
        <i />
      </span>
      <span>
        the third place<span>collective</span>
      </span>
    </Link>
  );
}
