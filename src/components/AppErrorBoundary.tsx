import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-card">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-destructive" />
            <h1 className="font-display text-xl font-semibold text-foreground">Erro ao carregar a tela</h1>
            <p className="mt-2 text-sm text-muted-foreground">Recarregue a página para continuar usando o app.</p>
            <Button className="mt-5 w-full gradient-primary" onClick={() => window.location.reload()}>
              Recarregar
            </Button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}