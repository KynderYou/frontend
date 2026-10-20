import { useEffect, useRef, useState } from 'react';

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** Small audio player for table cells: play/pause, a draggable seek bar and the remaining time. */
export function CompactAudio({ src, label }: { src: string; label: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (!scrubbing) setCurrent(audio.currentTime);
    };
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
      audio.currentTime = 0;
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [scrubbing]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      // Only one review plays at a time.
      document.querySelectorAll('audio').forEach((other) => {
        if (other !== audio) other.pause();
      });
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const seek = (value: number) => {
    setCurrent(value);
    if (audioRef.current) audioRef.current.currentTime = value;
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className={`compact-audio${playing ? ' is-playing' : ''}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button type="button" className="compact-audio-toggle" aria-label={`${playing ? 'Pause' : 'Play'} ${label}`} onClick={toggle}>
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
        )}
      </button>
      <input
        type="range"
        className="compact-audio-seek"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(current, duration || 0)}
        disabled={!duration}
        aria-label={`Seek ${label}`}
        style={{ ['--progress' as string]: `${progress}%` }}
        onPointerDown={() => setScrubbing(true)}
        onPointerUp={() => setScrubbing(false)}
        onChange={(e) => seek(Number(e.target.value))}
      />
      <span className="compact-audio-time">{playing || current > 0 ? clock(current) : clock(duration)}</span>
    </div>
  );
}
