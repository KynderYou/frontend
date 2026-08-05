import { useEffect, useState } from 'react';
import { fetchAuthenticatedAsset, openAuthenticatedAsset } from '../../api';
import type { Certification } from '../../api';

type CertificationCardProps = {
  cert: Certification;
  onDelete: (certId: number) => void;
};

function isImageFile(fileName: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(fileName);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Human-readable title from raw upload filename */
function displayTitle(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  if (!base) return 'Untitled upload';
  return base.length > 72 ? `${base.slice(0, 69)}…` : base;
}

export function CertificationCard({ cert, onDelete }: CertificationCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const showImage = isImageFile(cert.file_name);
  const title = displayTitle(cert.file_name);

  useEffect(() => {
    if (!showImage) return undefined;

    let cancelled = false;
    let objectUrl: string | null = null;

    fetchAuthenticatedAsset(cert.url)
      .then((url) => {
        if (!cancelled) {
          objectUrl = url;
          setPreviewUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [cert.url, showImage]);

  return (
    <article className="profile-cert-card">
      <div className="profile-cert-preview-wrap">
        <button
          type="button"
          className="profile-cert-preview-btn"
          onClick={() => openAuthenticatedAsset(cert.url)}
          aria-label={`View ${cert.file_name}`}
        >
          {showImage && previewUrl ? (
            <img src={previewUrl} alt={title} className="profile-cert-preview" />
          ) : (
            <div className="profile-cert-preview profile-cert-preview--placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6M10 13h4M10 17h4M10 9h1" />
              </svg>
              <span>Open document</span>
            </div>
          )}
        </button>

        <button
          type="button"
          className="btn-icon profile-cert-delete"
          aria-label={`Delete ${cert.file_name}`}
          onClick={() => onDelete(cert.id)}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>

      <footer className="profile-cert-footer">
        <h3 className="profile-cert-title" title={title}>
          {title}
        </h3>
        <p className="profile-cert-date">Added {formatDate(cert.created_at)}</p>
      </footer>
    </article>
  );
}
