import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export const OAUTH_RETURN_PATH_KEY = 'oauth_return_path';

export function sanitizeReturnPath(path: string | null | undefined) {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path === '/auth' || path.startsWith('/auth/callback')) {
    return '/';
  }

  return path;
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const finishedRef = useRef(false);

  const finishAuthentication = useCallback(async () => {
    setFailed(false);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const { data, error } = await supabase.auth.getSession();

      if (data.session?.user) {
        if (finishedRef.current) return;
        finishedRef.current = true;
        const destination = sanitizeReturnPath(sessionStorage.getItem(OAUTH_RETURN_PATH_KEY));
        sessionStorage.removeItem(OAUTH_RETURN_PATH_KEY);
        navigate(destination, { replace: true });
        return;
      }

      if (error) {
        console.error('Error capturing OAuth session:', error);
      }

      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }

    if (!finishedRef.current) setFailed(true);
  }, [navigate]);

  useEffect(() => {
    void finishAuthentication();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user || finishedRef.current) return;
      finishedRef.current = true;
      const destination = sanitizeReturnPath(sessionStorage.getItem(OAUTH_RETURN_PATH_KEY));
      sessionStorage.removeItem(OAUTH_RETURN_PATH_KEY);
      navigate(destination, { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [finishAuthentication, navigate]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        {failed ? (
          <>
            <h1 className="font-display text-xl font-semibold text-foreground">Não foi possível concluir o acesso</h1>
            <p className="text-sm text-muted-foreground">A sessão do Google não foi confirmada. Tente novamente.</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('/auth', { replace: true })}>Voltar</Button>
              <Button onClick={() => void finishAuthentication()}>Tentar novamente</Button>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <h1 className="font-display text-xl font-semibold text-foreground">Concluindo seu acesso</h1>
            <p className="text-sm text-muted-foreground">Aguarde enquanto confirmamos sua sessão.</p>
          </>
        )}
      </div>
    </main>
  );
};

export default AuthCallback;