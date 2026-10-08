import { useEffect, useState } from 'react';
import { fetchAuthenticatedAsset } from '../api/assetUrl';

/** Uploaded files are behind auth, so they are fetched into a temporary object URL. */
export function useProtectedFile(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    fetchAuthenticatedAsset(path, controller.signal)
      .then((next) => {
        objectUrl = next;
        setUrl(next);
      })
      .catch(() => {});
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);
  return path ? url : null;
}
