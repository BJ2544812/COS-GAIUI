import * as React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
  moduleName: string;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class SafeModule extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[SafeModule] Crash in ${this.props.moduleName}:`, error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.moduleName !== this.props.moduleName && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-12 text-center bg-white rounded-[3rem] shadow-xl animate-in fade-in zoom-in-95 duration-500">
           <div className="max-w-md space-y-8">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                 <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Module Load Failure</h3>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    The <span className="font-bold text-rose-600 uppercase tracking-widest text-[10px] px-2 py-1 bg-rose-50 rounded-lg">{this.props.moduleName}</span> module encountered a runtime exception. This typically happens when data shapes mismatch or local state becomes inconsistent.
                 </p>
                 {this.state.errorMessage ? (
                   <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-slate-950 p-4 text-left text-xs text-rose-100 whitespace-pre-wrap break-words">
                     {this.state.errorMessage}
                   </pre>
                 ) : null}
              </div>
              <Button 
                onClick={() => this.setState({ hasError: false, errorMessage: undefined })}
                className="h-14 rounded-2xl bg-slate-950 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest px-8 transition-all shadow-lg"
              >
                 <RefreshCw className="mr-2 w-4 h-4" /> Try Reloading Module
              </Button>
           </div>
        </div>
      );
    }

    return this.props.children;
  }
}
