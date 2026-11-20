import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, X } from 'lucide-react';
import { api } from '../../api/client';
import { ConfirmButton } from '../../components/ConfirmButton';
import { Status } from '../../components/Feedback';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/date';
import type { ReviewDecision, ReviewTarget } from './types';

type ReviewDialogProps = {
  target: ReviewTarget;
  onClose: () => void;
  onReviewed: () => Promise<void>;
};

export function ReviewDialog({ target, onClose, onReviewed }: ReviewDialogProps) {
  const { notify } = useApp();
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const record = target.record;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusableElements = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,textarea,select,[tabindex="0"]',
        ) || [],
      );
    focusableElements()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) onClose();
      if (event.key !== 'Tab') return;

      const elements = focusableElements();
      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isSaving, onClose]);

  async function submitDecision(status: ReviewDecision) {
    setIsSaving(true);
    try {
      await api(`/admin/${target.kind}/${record.id}`, 'PATCH', { status, note });
      notify(`Review saved: ${status}.`);
      await onReviewed();
    } catch (error) {
      notify((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close icon-button"
          aria-label="Close review"
          disabled={isSaving}
          onClick={onClose}
        >
          <X />
        </button>
        <p className="eyebrow">
          {target.kind === 'venues' ? 'VENUE APPLICATION' : 'GATHERING REVIEW'}
        </p>
        <h2 id="review-title">{'name' in record ? record.name : record.title}</h2>
        <Status value={record.status} />
        {'venue_name' in record && (
          <p>
            {record.venue_name} · {formatDate(record.starts_at)} · {record.capacity} places
          </p>
        )}
        <p className="event-description">{record.description}</p>
        <p>
          {record.city}
          {'address' in record ? ' · ' + record.address : ''}
        </p>
        {'owner_email' in record && (
          <p>
            Submitted by {record.owner_name} ({record.owner_email})
          </p>
        )}
        {'website' in record && record.website && (
          <a href={record.website} target="_blank" rel="noreferrer">
            Visit website <ArrowUpRight size={14} />
          </a>
        )}
        <label>
          Feedback for the host
          <textarea
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Required if rejecting; explain what needs to change."
          />
        </label>
        <div className="form-actions">
          <button
            className="button ghost"
            disabled={isSaving || note.trim().length < 5}
            onClick={() => submitDecision('rejected')}
          >
            Reject with feedback
          </button>
          <button
            className="button blue-button"
            disabled={isSaving || record.status === 'cancelled'}
            onClick={() => submitDecision('approved')}
          >
            {isSaving ? 'Saving…' : 'Approve'}
            <Check size={17} />
          </button>
        </div>
        {target.kind === 'events' && record.status === 'approved' && (
          <ConfirmButton onConfirm={() => submitDecision('cancelled')}>
            Cancel this gathering
          </ConfirmButton>
        )}
      </section>
    </div>
  );
}
