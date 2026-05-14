import React from 'react';
import {
  CheckCircle2, Clock, Cpu, AlertCircle, Zap, ArrowRight, ExternalLink,
  Lock, Sparkles, Construction, FlaskConical
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const STATUS_CONFIG: Record<ModuleStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}> = {
  live: {
    label: 'Live',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle2,
    desc: 'Fully operational with verified backend integration for this screen.'
  },
  partial: {
    label: 'Partial',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Clock,
    desc: 'Core features work. Some capabilities are still being completed.'
  },
  'backend-ready': {
    label: 'Backend Ready',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Cpu,
    desc: 'Database schema and API layer are complete. UI is being built.'
  },
  planned: {
    label: 'Planned',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: Construction,
    desc: 'Scheduled for development. Backend groundwork may be in progress.'
  },
  experimental: {
    label: 'Experimental',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: FlaskConical,
    desc: 'Preview release. Functionality may change.'
  },
  operational: {
    label: 'Operational',
    color: 'text-teal-800',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    icon: CheckCircle2,
    desc: 'Core workflows connected to the database; continue validation before calling production-complete.'
  },
  prototype: {
    label: 'Prototype',
    color: 'text-orange-800',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: FlaskConical,
    desc: 'Illustrative or partial UI — not fully backed by live APIs.'
  },
  placeholder: {
    label: 'Placeholder',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: Construction,
    desc: 'Screen reserved for future work — no operational backend in this build.'
  }
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
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
            <Icon className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                <StatusIcon className="w-3 h-3" />
                {cfg.label}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-2xl border p-5 flex items-start gap-4 ${cfg.bg} ${cfg.border}`}>
        <StatusIcon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} />
        <div>
          <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label} — {cfg.desc}</p>
          {status === 'backend-ready' && (
            <p className="text-xs text-blue-600 mt-1 font-medium">
              The Prisma schema, service layer, and API routes for this module are complete. The admin UI surface is the only remaining step.
            </p>
          )}
          {status === 'planned' && (
            <p className="text-xs text-slate-500 mt-1 font-medium">
              This module is on the platform roadmap. Core domain models may already be defined in the schema.
            </p>
          )}
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

          {/* Status Detail Card */}
          <Card className={`border shadow-sm ${cfg.bg} ${cfg.border}`}>
            <CardContent className="p-5 space-y-3">
              <div className={`flex items-center gap-2 ${cfg.color}`}>
                <StatusIcon className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">{cfg.label}</span>
              </div>
              <p className={`text-xs font-medium leading-relaxed ${cfg.color} opacity-80`}>{cfg.desc}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
