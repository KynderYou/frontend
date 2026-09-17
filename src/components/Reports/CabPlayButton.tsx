import { useEffect, useRef, useState } from 'react';
import { fetchAuthenticatedAsset } from '../../api';
import { formatDuration } from './reportTypes';

type CabPlayButtonProps = {
  url: string | null | undefined;
  title?: string;
  /** Known duration from API; overridden once audio metadata loads. */
  durationSec?: number;
  className?: string;
  compact?: boolean;
};

function formatClock(totalSec: number) {
  if (!Number.isFinite(totalSec) || totalSec < 0) return '0:00';
  return formatDuration(Math.floor(totalSec));
}

/** Play/pause + seek scrubber for auth-protected CAB audio. */
export function CabPlayButton({
  url,
  title = 'Play audio',
  durationSec = 0,
  className = 'reports-cab-play',
  compact = false,
}: CabPlayButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const scrubbingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [totalSec, setTotalSec] = useState(durationSec > 0 ? durationSec : 0);

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
    setCurrentSec(0);
    setTotalSec(durationSec > 0 ? durationSec : 0);
    audioRef.current?.pause();
    audioRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, [url, durationSec]);

  if (!url) {
    return (
      <div className={`cab-audio-player${compact ? ' is-compact' : ''}`}>
        <span className={className} aria-hidden="true" title="Audio file unavailable" style={{ opacity: 0.45 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    );
  }

  const bindAudioEvents = (audio: HTMLAudioElement) => {
    const syncDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setTotalSec(audio.duration);
      }
    };
    audio.addEventListener('loadedmetadata', syncDuration);
    audio.addEventListener('durationchange', syncDuration);
    audio.addEventListener('timeupdate', () => {
      if (!scrubbingRef.current) setCurrentSec(audio.currentTime);
    });
    audio.addEventListener('ended', () => {
      setPlaying(false);
      setCurrentSec(0);
    });
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('play', () => setPlaying(true));
  };

  const ensureAudio = async () => {
    if (audioRef.current) return audioRef.current;
    setLoading(true);
    try {
      const objectUrl = await fetchAuthenticatedAsset(url);
      objectUrlRef.current = objectUrl;
      const audio = new Audio(objectUrl);
      bindAudioEvents(audio);
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

  const seekTo = async (nextSec: number) => {
    const audio = audioRef.current ?? (await ensureAudio());
    if (!audio) return;
    const max = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : totalSec;
    const clamped = Math.max(0, Math.min(nextSec, max || nextSec));
    audio.currentTime = clamped;
    setCurrentSec(clamped);
  };

  const max = totalSec > 0 ? totalSec : Math.max(currentSec, 1);

  return (
    <div className={`cab-audio-player${compact ? ' is-compact' : ''}`}>
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

      <div className="cab-audio-scrub">
        <input
          type="range"
          className="cab-audio-seek"
          min={0}
          max={max}
          step={0.1}
          value={Math.min(currentSec, max)}
          aria-label={`Seek ${title}`}
          disabled={loading || failed}
          onPointerDown={() => {
            scrubbingRef.current = true;
          }}
          onPointerUp={() => {
            scrubbingRef.current = false;
          }}
          onChange={(e) => {
            const next = Number(e.target.value);
            setCurrentSec(next);
            void seekTo(next);
          }}
          onKeyDown={(e) => {
            const jump = e.shiftKey ? 10 : 5;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault();
              void seekTo(currentSec - jump);
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              e.preventDefault();
              void seekTo(currentSec + jump);
            } else if (e.key === 'Home') {
              e.preventDefault();
              void seekTo(0);
            } else if (e.key === 'End' && totalSec > 0) {
              e.preventDefault();
              void seekTo(totalSec);
            }
          }}
        />
        <div className="cab-audio-times" aria-hidden="true">
          <span>{formatClock(currentSec)}</span>
          <span>{totalSec > 0 ? formatClock(totalSec) : '--:--'}</span>
        </div>
      </div>
    </div>
  );
}
