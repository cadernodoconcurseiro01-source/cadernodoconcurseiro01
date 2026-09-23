import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [checking, setChecking] = useState(true);
  const [validRecovery, setValidRecovery] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const hasRecoveryHash = hash.get('type') === 'recovery';

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (hasRecoveryHash && session)) setValidRecovery(true);
      setChecking(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setValidRecovery((current) => current || Boolean(hasRecoveryHash && data.session));
      setChecking(false);
    }).catch(() => setChecking(false));

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmation) {
      toast.error('As senhas não coincidem.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success('Senha alterada. Entre novamente.');
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Não foi possível alterar a senha. Solicite um novo link.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-elevated">
        <img src={logo} alt="Caderno do Concurseiro 01" className="mx-auto mb-4 h-24 w-auto" />
        <h1 className="text-center font-display text-2xl font-bold">Crie uma nova senha</h1>
        {checking ? <p className="mt-6 text-center text-sm text-muted-foreground">Validando seu link...</p> : validRecovery ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10" minLength={6} required autoFocus /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirme a nova senha</Label>
              <Input id="confirm-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={6} required />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Alterando...' : 'Alterar senha'}</Button>
          </form>
        ) : (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-sm text-muted-foreground">Este link é inválido ou expirou.</p>
            <Button onClick={() => navigate('/forgot-password')}>Solicitar novo link</Button>
          </div>
        )}
      </Card>
    </main>
  );
};

export default ResetPassword;