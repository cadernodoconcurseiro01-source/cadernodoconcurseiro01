import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;

    try {
      setSending(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('E-mail de redefinição enviado.');
    } catch (error) {
      console.error('Password recovery error:', error);
      toast.error('Não foi possível enviar o e-mail. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md p-8 shadow-elevated">
        <img src={logo} alt="Caderno do Concurseiro 01" className="mx-auto mb-4 h-24 w-auto" />
        <h1 className="text-center font-display text-2xl font-bold">Redefinir senha</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {sent ? 'Confira sua caixa de entrada e abra o link que enviamos.' : 'Informe seu e-mail para receber o link de redefinição.'}
        </p>

        {!sent && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" autoComplete="email" required autoFocus />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={sending}>{sending ? 'Enviando...' : 'Enviar link'}</Button>
          </form>
        )}

        <Button asChild variant="ghost" className="mt-4 w-full">
          <Link to="/auth"><ArrowLeft className="mr-2 h-4 w-4" />Voltar ao login</Link>
        </Button>
      </Card>
    </main>
  );
};

export default ForgotPassword;