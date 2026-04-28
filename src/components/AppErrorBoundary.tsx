import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-card">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-destructive" />
            <h1 className="font-display text-xl font-semibold text-foreground">Erro ao carregar a tela</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Algo deu errado nesta tela. Tente novamente ou recarregue a página.
            </p>
            {this.state.error?.message && (
              <p className="mt-3 rounded bg-muted/50 p-2 text-xs text-muted-foreground/80 break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <Button className="w-full gradient-primary" onClick={this.handleReset}>
                Tentar novamente
              </Button>
              <Button variant="outline" className="w-full" onClick={this.handleReload}>
                Recarregar página
              </Button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
