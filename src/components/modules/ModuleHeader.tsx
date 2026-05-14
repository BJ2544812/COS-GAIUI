/**
 * ModuleHeader — consistent top section for every admin module.
 * Provides: title, subtitle, status badge, breadcrumb, and action slot.
 */
import React from 'react';
import { CheckCircle2, Clock, Cpu, Construction, FlaskConical, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModuleStatus, ERPModule } from '@/types';

interface ModuleHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  status?: ModuleStatus;
  /** Breadcrumb path e.g. ['Finance', 'Accounting'] */
  breadcrumb?: string[];
  /** Right-side action buttons */
  actions?: React.ReactNode;
  /** Icon shown beside title */
  icon?: React.ComponentType<{ className?: string }>;
}

const STATUS_MAP: Record<ModuleStatus, { label: string; icon: React.ComponentType<{ className?: string }>; classes: string }> = {
  live:            { label: 'Live',             icon: CheckCircle2,  classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  operational:     { label: 'Operational',     icon: CheckCircle2,  classes: 'bg-teal-50 text-teal-800 border-teal-200' },
  partial:         { label: 'Partial',         icon: Clock,         classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  prototype:       { label: 'Prototype',       icon: FlaskConical,  classes: 'bg-orange-50 text-orange-800 border-orange-200' },
  placeholder:     { label: 'Placeholder',   icon: Construction,  classes: 'bg-slate-100 text-slate-600 border-slate-200' },
  'backend-ready': { label: 'Backend Ready',   icon: Cpu,           classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  planned:         { label: 'Planned',         icon: Construction,  classes: 'bg-slate-50 text-slate-500 border-slate-200' },
  experimental:    { label: 'Experimental',    icon: FlaskConical,  classes: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export function ModuleHeader({ title, subtitle, status, breadcrumb, actions, icon: Icon }: ModuleHeaderProps) {
  const cfg = status ? STATUS_MAP[status] : null;
  const StatusIcon = cfg?.icon;

  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
              <span className={cn(i === breadcrumb.length - 1 ? 'text-slate-600' : 'text-slate-400')}>{crumb}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Left: title + badge */}
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-brand-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
              {cfg && StatusIcon && (
                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border', cfg.classes)}>
                  <StatusIcon className="w-3 h-3" />
                  {cfg.label}
                </span>
              )}
            </div>
            {subtitle && <div className="text-sm text-slate-500 font-medium mt-1">{subtitle}</div>}
          </div>
        </div>

        {/* Right: actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StatCard — consistent KPI metric card used across all modules.
 */
interface StatCardProps {
  label: React.ReactNode;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: string; positive: boolean };
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  topRightBadge?: React.ReactNode;
}

export function StatCard({ label, value, icon: Icon, iconColor = 'text-brand-primary', iconBg = 'bg-brand-primary/10', trend, loading, onClick, className, topRightBadge }: StatCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow', onClick && 'cursor-pointer', className)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {topRightBadge && <div>{topRightBadge}</div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
        {loading ? (
          <div className="h-7 w-16 bg-slate-100 rounded-lg animate-pulse" />
        ) : (
          <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
        )}
        {trend && !loading && (
          <p className={cn('text-[10px] font-bold mt-1.5', trend.positive ? 'text-emerald-600' : 'text-rose-600')}>
            {trend.positive ? '▲' : '▼'} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * SectionCard — consistent card wrapper with header and body.
 */
interface SectionCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({ title, subtitle, actions, children, className, noPadding }: SectionCardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}

/**
 * EmptyState — consistent empty state for lists and tables.
 */
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-400 font-medium max-w-sm leading-relaxed mb-6">{description}</p>}
      {action}
    </div>
  );
}

/**
 * ActionButton — primary/secondary action button with consistent styling.
 */
interface ActionButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ActionButton({ label, onClick, variant = 'primary', icon: Icon, disabled, size = 'md', className }: ActionButtonProps) {
  const base = 'inline-flex items-center gap-2 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm' };
  const variants = {
    primary:   'bg-brand-primary text-white hover:opacity-90 shadow-sm shadow-brand-primary/20',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    danger:    'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
    ghost:     'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={cn(base, sizes[size], variants[variant], className)}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

/**
 * LoadingSkeleton — consistent skeleton loader.
 */
export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse p-6">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-100 rounded-lg w-1/3" />
            <div className="h-2.5 bg-slate-100 rounded-lg w-1/2" />
          </div>
          <div className="h-5 w-16 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}
