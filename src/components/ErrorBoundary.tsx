import * as React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Critical crash detected:', error, errorInfo);
    void import('@/lib/apiClient').then(({ apiRequest }) =>
      apiRequest('platform/client-errors', {
        method: 'POST',
        body: {
          message: error.message,
          stack: error.stack?.slice(0, 4000),
          module: 'root-error-boundary',
        },
      }).catch(() => {}),
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
          <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
             <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-rose-100/50">
                <ShieldAlert size={40} />
             </div>
             <div className="space-y-3">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Something went wrong</h2>
                <p className="text-slate-500 font-medium leading-relaxed">The application encountered an unexpected state and had to halt. Your data is safe, but the current view crashed.</p>
             </div>
             
             {process.env.NODE_ENV === 'development' && (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 overflow-auto max-h-40">
                   <p className="text-[10px] font-mono text-rose-600 whitespace-pre">{this.state.error?.stack}</p>
                </div>
             )}

             <div className="flex flex-col gap-4">
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full h-16 rounded-2xl bg-slate-950 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-xl transition-all"
                >
                   <RefreshCw className="mr-2 w-4 h-4" /> Restart Application
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => window.location.href = '/'}
                  className="w-full h-14 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest"
                >
                   <Home className="mr-2 w-4 h-4" /> Return to Dashboard
                </Button>
             </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
