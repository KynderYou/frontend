import { useEffect, useState } from 'react';
import { getScanCabAudios, uploadScanCabAudio, type ScanCabAudio } from '../../api/endpoints/cabUpload';
import { colors, spacing } from '../../styles/theme';

const theme = colors.light;

type MisCabUploadModalProps = {
  open: boolean;
  scanCode: string;
  clientName?: string;
  onClose: () => void;
  onUploaded?: () => void;
};

export function MisCabUploadModal({ open, scanCode, clientName, onClose, onUploaded }: MisCabUploadModalProps) {
  const [audios, setAudios] = useState<ScanCabAudio[]>([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !scanCode) return;
    const controller = new AbortController();
    getScanCabAudios(scanCode, controller.signal)
      .then(setAudios)
      .catch(() => setAudios([]));
    return () => controller.abort();
  }, [open, scanCode]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Choose an audio file.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await uploadScanCabAudio(scanCode, file, title);
      setAudios(result.audios);
      setTitle('');
      setFile(null);
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setLoading(false);
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
      <div className="modal-panel reports-cab-modal" role="dialog" aria-modal="true" aria-label="Upload CAB audio">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Upload CAB</h2>
            <p className="modal-subtitle">
              Scan {scanCode}
              {clientName ? ` · ${clientName}` : ''}
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
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

            <label className="form-field">
              <span className="form-label">Audio title</span>
              <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Learning style overview" />
            </label>

            <label className="form-field" style={{ marginTop: spacing[3] }}>
              <span className="form-label">Audio file</span>
              <input
                className="form-input"
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.webm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <div style={{ marginTop: spacing[5] }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: theme['text-primary'] }}>Recent uploads</h3>
              {audios.length === 0 ? (
                <p style={{ margin: `${spacing[2]} 0 0`, fontSize: 13, color: theme['text-muted'] }}>No CAB audio uploaded for this scan yet.</p>
              ) : (
                <ul className="reports-cab-list" style={{ marginTop: spacing[2] }}>
                  {audios.map((audio) => (
                    <li key={audio.id} className="reports-cab-item">
                      <span className="reports-cab-item-body">
                        <span className="reports-cab-item-title">{audio.title}</span>
                        <span className="reports-cab-item-meta">
                          {audio.file_name} · {audio.uploaded_at}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-pill-secondary" onClick={onClose} disabled={loading}>
              Close
            </button>
            <button type="submit" className="btn-pill-primary" disabled={loading || !file}>
              {loading ? 'Uploading…' : 'Upload CAB'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
