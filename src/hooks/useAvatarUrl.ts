import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Resolves an avatar path stored in profiles.avatar_url to a signed URL.
 * Handles both legacy full URLs (returns as-is) and storage paths.
 */
export function useAvatarUrl(storedUrl: string | null | undefined): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!storedUrl) {
      setSignedUrl(null);
      return;
    }

    // Legacy: if it's already a full URL, use it directly
    if (storedUrl.startsWith('http')) {
      setSignedUrl(storedUrl);
      return;
    }

    // It's a storage path — generate a signed URL
    let cancelled = false;
    supabase.storage
      .from('avatars')
      .createSignedUrl(storedUrl, 3600)
      .then(({ data, error }) => {
        if (!cancelled && !error && data) {
          setSignedUrl(data.signedUrl);
        }
      })
      .catch((err) => {
        console.error('Error generating signed avatar URL:', err);
      });

    return () => { cancelled = true; };
  }, [storedUrl]);

  return signedUrl;
}
