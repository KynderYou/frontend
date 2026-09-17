import { useEffect, useRef, useState } from 'react';
import { fetchAuthenticatedAsset } from '../../api';

type CabPlayButtonProps = {
  url: string | null | undefined;
  title?: string;
  className?: string;
};

/** Play/pause control for auth-protected CAB audio files. */
export function CabPlayButton({ url, title = 'Play audio', className = 'reports-cab-play' }: CabPlayButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setPlaying(false);
    setFailed(false);
    audioRef.current?.pause();
    audioRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, [url]);

  if (!url) {
    return (
      <span className={className} aria-hidden="true" title="Audio file unavailable" style={{ opacity: 0.45 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    );
  }

  const ensureAudio = async () => {
    if (audioRef.current) return audioRef.current;
    setLoading(true);
    try {
      const objectUrl = await fetchAuthenticatedAsset(url);
      objectUrlRef.current = objectUrl;
      const audio = new Audio(objectUrl);
      audio.addEventListener('ended', () => setPlaying(false));
      audio.addEventListener('pause', () => setPlaying(false));
      audio.addEventListener('play', () => setPlaying(true));
      audioRef.current = audio;
      setFailed(false);
      return audio;
    } catch {
      setFailed(true);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const toggle = async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    const audio = await ensureAudio();
    if (!audio) return;
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setFailed(true);
      setPlaying(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      aria-label={playing ? `Pause ${title}` : `Play ${title}`}
      title={failed ? 'Unable to play audio' : playing ? 'Pause' : 'Play'}
      disabled={loading}
      onClick={() => {
        void toggle();
      }}
      style={failed ? { opacity: 0.55 } : undefined}
    >
      {loading ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
        </svg>
      ) : playing ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}
