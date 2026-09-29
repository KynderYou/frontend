import { useEffect, useState } from 'react';
import { updateTrainee } from '../../api';
import type { TraineeApi } from '../../api/types';
import { colors, spacing } from '../../styles/theme';
import { TraineeFormFields, type TraineeMentorOption } from './TraineeFormFields';
import {
  emptyTraineeForm,
  traineeErrorMessage,
  traineeFormToPayload,
  traineeToForm,
  validateTraineeForm,
  type TraineeFormState,
} from './traineeForm';

const theme = colors.light;

type EditTraineeModalProps = {
  trainee: TraineeApi | null;
  mentors: TraineeMentorOption[];
  onClose: () => void;
  onSaved: (trainee: TraineeApi, message: string) => void;
};

export function EditTraineeModal({ trainee, mentors, onClose, onSaved }: EditTraineeModalProps) {
  const [form, setForm] = useState<TraineeFormState>(emptyTraineeForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (trainee) {
      setForm(traineeToForm(trainee));
      setError('');
    }
  }, [trainee]);

  useEffect(() => {
    if (!trainee) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [trainee, onClose]);

  if (!trainee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validateTraineeForm(form);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await updateTrainee(trainee.id, traineeFormToPayload(form));
      onSaved(result.trainee, result.message);
      onClose();
    } catch (err) {
      setError(traineeErrorMessage(err, 'Unable to save trainee details.'));
    } finally {
      setSaving(false);
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
      <div className="modal-panel admin-profile-modal" role="dialog" aria-modal="true" aria-label="Edit trainee">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Edit trainee</h2>
            <p className="modal-subtitle">{trainee.name} · directory record, no login</p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error ? (
              <p role="alert" style={{ color: theme.error, fontSize: 13, marginBottom: spacing[3] }}>
                {error}
              </p>
            ) : null}
            <TraineeFormFields form={form} mentors={mentors} onChange={setForm} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-pill-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-pill-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save trainee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
