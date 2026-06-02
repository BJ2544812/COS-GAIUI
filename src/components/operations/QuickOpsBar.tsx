import * as React from 'react';
import {
  CalendarCheck,
  Users,
  Bell,
  ListTodo,
  Radio,
  LayoutDashboard,
  Heart,
  CreditCard,
  Target,
  Library,
  Star,
  Music4,
  MessageCircle,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ERPModule } from '@/types';
import { labelForQuickOp } from '@/lib/roleExperience';

const UCOS_LIVE_SERVICE_ID = 'ucos_live_service_id';

const ICON_BY_MODULE: Partial<Record<ERPModule, React.ElementType>> = {
  dashboard: LayoutDashboard,
  'sunday-mode': Radio,
  attendance: CalendarCheck,
  volunteers: Users,
  notifications: Bell,
  discipleship: ListTodo,
  giving: Heart,
  finance: CreditCard,
  budgets: Target,
  vendors: Library,
  events: Star,
  worship: Music4,
  members: Users,
  communication: MessageCircle,
  hr: ShieldCheck,
  workforce: Briefcase,
};

const ACCENT_BY_MODULE: Partial<Record<ERPModule, string>> = {
  dashboard: 'text-indigo-600',
  'sunday-mode': 'text-violet-600',
  attendance: 'text-emerald-600',
  volunteers: 'text-sky-600',
  notifications: 'text-amber-600',
  discipleship: 'text-slate-600',
  giving: 'text-rose-600',
  finance: 'text-emerald-600',
  budgets: 'text-emerald-600',
  vendors: 'text-emerald-600',
  events: 'text-indigo-600',
  worship: 'text-violet-600',
  members: 'text-indigo-600',
  communication: 'text-rose-600',
  hr: 'text-slate-600',
  workforce: 'text-slate-600',
};

const DEFAULT_MODULES: ERPModule[] = [
  'dashboard',
  'sunday-mode',
  'attendance',
  'volunteers',
  'notifications',
  'discipleship',
];

export function QuickOpsBar({
  activeModule,
  onModuleChange,
  hidden,
  modules,
}: {
  activeModule: ERPModule;
  onModuleChange: (m: ERPModule) => void;
  hidden?: boolean;
  modules?: ERPModule[];
}) {
  if (hidden) return null;

  const ids = modules?.length ? modules : DEFAULT_MODULES;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:left-64 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] safe-area-pb"
      aria-label="Quick operations"
    >
      <div className="flex justify-around items-stretch max-w-4xl mx-auto px-1">
        {ids.map((id) => {
          const Icon = ICON_BY_MODULE[id] ?? LayoutDashboard;
          const active = activeModule === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (id === 'sunday-mode') {
                  const last = sessionStorage.getItem(UCOS_LIVE_SERVICE_ID);
                  if (!last) {
                    /* user picks service inside Sunday Mode */
                  }
                }
                onModuleChange(id);
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 px-2 min-h-[56px] min-w-[56px] flex-1 transition-colors',
                active ? 'text-indigo-600' : 'text-slate-500',
              )}
            >
              <Icon className={cn('w-5 h-5', active && (ACCENT_BY_MODULE[id] ?? 'text-indigo-600'))} />
              <span className="text-[9px] font-black uppercase tracking-wide leading-none">{labelForQuickOp(id)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
