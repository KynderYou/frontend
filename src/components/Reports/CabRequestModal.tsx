import { useEffect, useRef, useState } from 'react';
import type { ReportRecord } from './reportTypes';

const MAX_SECONDS = 240;

type CabRequestModalProps = {
  record: ReportRecord | null;
  onClose: () => void;
  onSend: (record: ReportRecord, audio: Blob, filename: string) => Promise<boolean>;
};

type Recording = { blob: Blob; url: string; filename: string };

function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return candidates.find((type) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) ?? '';
}

function extensionFor(mime: string): string {
  if (mime.includes('mp4')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** MLA records a voice note asking their mentor for CAB inputs on one scan. */
export function CabRequestModal({ record, onClose, onSend }: CabRequestModalProps) {
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => {
    if (!record) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [record, onClose, sending]);

  useEffect(
    () => () => {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      stopTracks();
    },
    [],
  );

  useEffect(() => () => {
    if (recording) URL.revokeObjectURL(recording.url);
  }, [recording]);

  if (!record) return null;

  const stop = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const start = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser cannot record audio. Try the latest Chrome, Edge or Safari.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stopTracks();
        setIsRecording(false);
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type });
        if (blob.size === 0) {
          setError('Nothing was recorded. Check your microphone and try again.');
          return;
        }
        setRecording({ blob, url: URL.createObjectURL(blob), filename: `cab-request-${record.scanId}.${extensionFor(type)}` });
      };
      recorderRef.current = recorder;
      setRecording(null);
      setSeconds(0);
      recorder.start();
      setIsRecording(true);
      const startedAt = Date.now();
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS && recorder.state === 'recording') recorder.stop();
      }, 500);
    } catch {
      stopTracks();
      setError('Microphone access was blocked. Allow the microphone for this site and try again.');
    }
  };

  const send = async () => {
    if (!recording || sending) return;
    setSending(true);
    const ok = await onSend(record, recording.blob, recording.filename);
    setSending(false);
    if (ok) onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !sending && !isRecording) onClose();
      }}
    >
      <div
        className="modal-panel cab-request-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cab-request-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="cab-request-title" className="modal-title">
              Request CAB
            </h2>
            <p className="modal-subtitle">
              Scan {record.scanId} · {record.details.name || 'Client'}
            </p>
          </div>
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose} disabled={sending || isRecording}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className={`cab-recorder${isRecording ? ' is-recording' : ''}`}>
            <button
              type="button"
              className="cab-recorder-btn"
              onClick={() => (isRecording ? stop() : void start())}
              disabled={sending}
              aria-label={isRecording ? 'Stop recording' : recording ? 'Record again' : 'Start recording'}
            >
              {isRecording ? (
                <span className="cab-recorder-stop" aria-hidden="true" />
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              )}
            </button>
            <div className="cab-recorder-copy">
              <strong>{isRecording ? `Recording… ${clock(seconds)}` : recording ? 'Voice note ready' : 'Tap to record'}</strong>
              <span>
                {isRecording
                  ? `Tap again to stop · up to ${clock(MAX_SECONDS)}`
                  : recording
                    ? 'Play it back below, or tap the mic to record again.'
                    : 'Share a voice note to your mentor about the client and specific inputs needed for you (not more than 3-4 mins).'}
              </span>
            </div>
          </div>

          {recording && !isRecording ? <audio className="cab-recorder-preview" controls src={recording.url} /> : null}
          {error ? <p className="cab-recorder-error">{error}</p> : null}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-pill-secondary" onClick={onClose} disabled={sending || isRecording}>
            Cancel
          </button>
          <button type="button" className="btn-pill-primary" onClick={() => void send()} disabled={!recording || isRecording || sending}>
            {sending ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  );
}
