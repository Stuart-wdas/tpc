import { useState, type ReactNode } from 'react';
import { useApp } from '../context/AppContext';

export function ConfirmButton({
  onConfirm,
  children,
  className = 'button ghost small',
}: {
  onConfirm: () => Promise<void>;
  children: ReactNode;
  className?: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const { notify } = useApp();
  return confirm ? (
    <span className="confirm">
      <span>Are you sure?</span>
      <button
        disabled={busy}
        className="button small danger"
        onClick={async () => {
          setBusy(true);
          try {
            await onConfirm();
            setConfirm(false);
          } catch (e) {
            notify((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Working…' : 'Yes, confirm'}
      </button>
      <button disabled={busy} className="text-button" onClick={() => setConfirm(false)}>
        Keep it
      </button>
    </span>
  ) : (
    <button className={className} onClick={() => setConfirm(true)}>
      {children}
    </button>
  );
}
