import { useProtectedFile } from '../../hooks/useProtectedFile';

type ProtectedAudioProps = {
  path: string;
  className?: string;
};

export function ProtectedAudio({ path, className = 'protected-audio' }: ProtectedAudioProps) {
  const src = useProtectedFile(path);
  if (!src) return <div className={`${className} is-loading`} aria-hidden="true" />;
  return <audio className={className} controls preload="metadata" src={src} />;
}
