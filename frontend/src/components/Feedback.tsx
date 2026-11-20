export function Loading() {
  return (
    <div className="empty" role="status">
      <span className="spinner" /> Finding your place…
    </div>
  );
}

export function ErrorBox({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <div className="error" role="alert">
      {error}
      {retry && (
        <button className="text-button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Status({ value }: { value: string }) {
  return (
    <span className={`status ${value}`}>
      {value === 'pending' ? 'Awaiting review' : value.charAt(0).toUpperCase() + value.slice(1)}
    </span>
  );
}
