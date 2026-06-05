import React from 'react';
import {
  CheckCircle2, Zap, ArrowRight, Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ERPModule, ModuleStatus } from '@/types';

interface PlaceholderModuleProps {
  title: string;
  subtitle: string;
  status: ModuleStatus;
  icon: React.ComponentType<{ className?: string }>;
  capabilities?: string[];
  apiEndpoints?: string[];
  relatedModules?: { label: string; module: ERPModule }[];
  onModuleChange?: (module: ERPModule) => void;
  children?: React.ReactNode;
}

const STATUS_DESC: Record<ModuleStatus, string> = {
  live: 'This screen is available for use.',
  partial: 'Some interactions are still being completed.',
  'backend-ready': 'Backend services are available; UI wiring is still in progress.',
  planned: 'This screen is reserved for upcoming implementation.',
  experimental: 'This screen is in early preview and may change.',
  operational: 'Core workflows are available for routine use.',
  prototype: 'This is an early workflow draft with limited scope.',
  placeholder: 'This screen is intentionally limited until backend support is completed.',
};

export function PlaceholderModule({
  title,
  subtitle,
  status,
  icon: Icon,
  capabilities = [],
  apiEndpoints = [],
  relatedModules = [],
  onModuleChange,
  children,
}: PlaceholderModuleProps) {
  const desc = STATUS_DESC[status];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
            <Icon className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{title}</h1>
            <p className="text-slate-500 text-sm font-medium">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Context Banner */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex items-start gap-4">
        <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-slate-500" />
        <div>
          <p className="text-sm font-medium text-slate-700">{desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content or capabilities */}
        <div className="lg:col-span-2 space-y-6">
          {children ? children : (
            <Card className="border-none shadow-sm">
              <CardContent className="p-8 flex flex-col items-center justify-center min-h-[280px] text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Icon className="w-10 h-10 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                    {status === 'backend-ready'
                      ? 'The backend infrastructure is fully ready. Build the UI layer to unlock this capability.'
                      : status === 'planned'
                      ? 'This module is planned. Architecture design and domain modeling are the next steps.'
                      : status === 'experimental'
                      ? 'This is an early-access preview. Connect real APIs to complete this module.'
                      : 'This module is being expanded. Some features are still being connected.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Capabilities */}
          {capabilities.length > 0 && (
            <Card className="border-none shadow-sm">
              <div className="px-6 pt-6 pb-4 border-b border-slate-50">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  Platform Capabilities
                </h3>
                <p className="text-xs text-slate-400 mt-1">Features supported by the backend for this module.</p>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {capabilities.map((cap, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 leading-relaxed">{cap}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: API + Related */}
        <div className="space-y-5">
          {/* API Endpoints */}
          {apiEndpoints.length > 0 && (
            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">
                    Connected API
                  </h3>
                </div>
              </div>
              <CardContent className="p-5 space-y-2">
                {apiEndpoints.map((ep, i) => (
                  <div key={i} className="flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                    <span className="text-indigo-400 font-bold">▸</span>
                    <span className="text-slate-300">{ep}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Related Modules */}
          {relatedModules.length > 0 && onModuleChange && (
            <Card className="border-none shadow-sm">
              <div className="px-5 pt-5 pb-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Related Modules
                  </h3>
                </div>
              </div>
              <CardContent className="p-4 space-y-2">
                {relatedModules.map((rm, i) => (
                  <button
                    key={i}
                    onClick={() => onModuleChange(rm.module)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-all group text-left"
                  >
                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{rm.label}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
