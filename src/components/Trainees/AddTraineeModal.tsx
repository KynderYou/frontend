import { useEffect, useState } from 'react';
import { createTrainee } from '../../api';
import type { Mentor } from './traineesData';

type AddTraineeModalProps = {
  open: boolean;
  mentors: Mentor[];
  defaultMentorId?: string;
  onClose: () => void;
  onCreated: () => void;
};

export function AddTraineeModal({
  open,
  mentors,
  defaultMentorId = '',
  onClose,
  onCreated,
}: AddTraineeModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [doj, setDoj] = useState('');
  const [mentorId, setMentorId] = useState(defaultMentorId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setPhone('');
    setEmail('');
    setDoj('');
    setMentorId(defaultMentorId || mentors[0]?.id || '');
    setError('');
    setSubmitting(false);
  }, [open, defaultMentorId, mentors]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit = name.trim().length > 0 && Boolean(mentorId) && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await createTrainee({
        name: name.trim(),
        mentor_id: Number(mentorId),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        doj: doj || undefined,
        status: 'Active',
      });
      onCreated();
      onClose();
    } catch {
      setError('Could not save trainee details. Check the fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-trainee-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480 }}
      >
        <div className="modal-header">
          <div>
            <h2 id="add-trainee-title" className="modal-title">
              Add trainee
            </h2>
            <p className="modal-subtitle">
              Directory details only — trainees are not login users. Mentors see them under Referred by.
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="form-field">
              <span className="form-label">Name</span>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Trainee full name"
                required
                autoFocus
              />
            </label>
            <label className="form-field">
              <span className="form-label">Mentor</span>
              <select
                className="form-input form-select"
                value={mentorId}
                onChange={(e) => setMentorId(e.target.value)}
                required
              >
                <option value="">Select mentor</option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Phone</span>
              <input
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                inputMode="tel"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Email</span>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Optional contact email"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Date of joining</span>
              <input className="form-input" type="date" value={doj} onChange={(e) => setDoj(e.target.value)} />
            </label>
            {error ? <p className="scans-upload-error" style={{ margin: 0 }}>{error}</p> : null}
          </div>
          <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn-pill-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-pill-primary" disabled={!canSubmit}>
              {submitting ? 'Saving…' : 'Save trainee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
