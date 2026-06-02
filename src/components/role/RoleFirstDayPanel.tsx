import * as React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ERPModule } from '@/types';
import type { RoleArchetype } from '@/lib/roleExperience';

type DayStep = { label: string; detail: string; module: ERPModule; tab?: string };

const STEPS_BY_ARCHETYPE: Partial<Record<RoleArchetype, DayStep[]>> = {
  church_admin: [
    { label: 'Review upcoming events', detail: 'Confirm dates, venues, and approval status.', module: 'events' },
    { label: 'Check attendance setup', detail: 'Open sessions before Sunday or midweek gatherings.', module: 'attendance' },
    { label: 'Volunteer rosters', detail: 'See who is serving this week.', module: 'volunteers' },
    { label: 'Send a church update', detail: 'Post announcements to members.', module: 'communication' },
  ],
  youth_pastor: [
    { label: 'Sunday run sheet', detail: 'Live timing and teams for youth gathering.', module: 'sunday-mode' },
    { label: 'Youth events', detail: 'Create or review Youth Alive and outreach nights.', module: 'events' },
    { label: 'Check-in', detail: 'Record who attended last gathering.', module: 'attendance' },
    { label: 'Worship planning', detail: 'Songs, team, and service flow.', module: 'worship' },
  ],
  accountant: [
    { label: 'Voucher registry', detail: 'Record and review expenses — your daily desk.', module: 'finance', tab: 'vouchers' },
    { label: 'Giving ledger', detail: 'Match gifts to funds.', module: 'giving' },
    { label: 'Budgets', detail: 'Track spending against approved budgets.', module: 'budgets' },
    { label: 'Reports', detail: 'Export summaries for the treasurer.', module: 'analytics' },
  ],
  volunteer_coordinator: [
    { label: 'Volunteer desk', detail: 'Assignments, roles, and team health.', module: 'volunteers' },
    { label: 'Sunday teams', detail: 'Greeters, ushers, and live run sheet.', module: 'sunday-mode' },
    { label: 'Check-in', detail: 'Confirm who served and who attended.', module: 'attendance' },
    { label: 'People lookup', detail: 'Find members to invite to teams.', module: 'members' },
  ],
  small_group_leader: [
    { label: 'Your groups', detail: 'Roster, meeting rhythm, and members.', module: 'small-groups' },
    { label: 'Group attendance', detail: 'Record who met this week.', module: 'attendance' },
    { label: 'Member care', detail: 'Notes and follow-ups for your group.', module: 'discipleship' },
    { label: 'Find a member', detail: 'Contact details and family link.', module: 'members' },
  ],
  staff_desk: [
    { label: 'Find a member', detail: 'Search directory and update basic info.', module: 'members' },
    { label: 'Events calendar', detail: 'What is happening at church this week.', module: 'events' },
    { label: 'Sunday support', detail: 'Live service view if you help on Sunday.', module: 'sunday-mode' },
    { label: 'Alerts', detail: 'Read office announcements.', module: 'notifications' },
  ],
};

export function RoleFirstDayPanel({
  archetype,
  onModuleChange,
}: {
  archetype: RoleArchetype;
  onModuleChange?: (m: ERPModule, tab?: string) => void;
}) {
  const steps = STEPS_BY_ARCHETYPE[archetype];
  if (!steps?.length || !onModuleChange) return null;

  const storageKey = `church_role_day1_dismissed_${archetype}`;
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  return (
    <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Your first day</p>
            <h2 className="text-lg font-black text-slate-900">Start here — four steps for today</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              These are the tasks most people in your role open first. You can hide this card once you are comfortable.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="text-[10px] font-black uppercase tracking-widest text-slate-500"
          onClick={() => {
            try {
              localStorage.setItem(storageKey, '1');
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
        >
          Dismiss
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step, i) => (
          <button
            key={step.module + step.label}
            type="button"
            onClick={() => onModuleChange(step.module, step.tab)}
            className="text-left p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group"
          >
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Step {i + 1}</p>
            <p className="font-bold text-slate-900 mt-1 group-hover:text-indigo-600">{step.label}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.detail}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 mt-3">
              Open <ArrowRight className="w-3 h-3" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
