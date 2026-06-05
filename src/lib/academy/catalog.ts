import type { WalkthroughTrackId } from '@/lib/walkthroughs';
import type { ERPModule } from '@/types';

export type AcademyLesson = {
  id: string;
  title: string;
  summary: string;
  durationMin: number;
  docPath?: string;
  module?: ERPModule;
  tab?: string;
};

export type AcademyModule = {
  id: string;
  title: string;
  lessons: AcademyLesson[];
};

export type AcademyTrack = {
  id: WalkthroughTrackId | 'platform_admin';
  title: string;
  subtitle: string;
  modules: AcademyModule[];
};

/** Academy framework — content scales by adding lessons; links to guides and admin deep links. */
export const ACADEMY_TRACKS: AcademyTrack[] = [
  {
    id: 'senior_pastor',
    title: 'Pastoral leadership',
    subtitle: 'Lead people, care, and stewardship.',
    modules: [
      {
        id: 'pastor-orientation',
        title: 'Orientation',
        lessons: [
          { id: 'p1', title: 'Your first day', summary: 'Login, home dashboard, pastoral lens.', durationMin: 10, docPath: '/guides/senior-pastor.md', module: 'dashboard' },
          { id: 'p2', title: 'Pastoral care desk', summary: 'Cases, tasks, and follow-up.', durationMin: 15, module: 'discipleship' },
          { id: 'p3', title: 'People & pathways', summary: 'Members and growth stages.', durationMin: 12, module: 'members' },
        ],
      },
    ],
  },
  {
    id: 'church_admin',
    title: 'Church operations',
    subtitle: 'Run events, Sunday, and volunteers.',
    modules: [
      {
        id: 'admin-orientation',
        title: 'Operations',
        lessons: [
          { id: 'a1', title: 'First day checklist', summary: 'Settings, events, Sunday Service.', durationMin: 15, docPath: '/guides/church-administrator.md', module: 'settings' },
          { id: 'a2', title: 'Event lifecycle', summary: 'Create, approve, and close events.', durationMin: 20, module: 'events' },
          { id: 'a3', title: 'Volunteer coordination', summary: 'Rosters and Sunday teams.', durationMin: 12, module: 'volunteers' },
        ],
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finance & stewardship',
    subtitle: 'Gifts, ledger, and month-end.',
    modules: [
      {
        id: 'finance-core',
        title: 'Treasurer essentials',
        lessons: [
          { id: 'f1', title: 'First week as treasurer', summary: 'Giving, vouchers, recon.', durationMin: 30, docPath: '/guides/finance-manager.md', module: 'finance', tab: 'vouchers' },
          { id: 'f2', title: 'Month-end', summary: 'Reports, audit, financial year.', durationMin: 25, module: 'analytics' },
        ],
      },
    ],
  },
  {
    id: 'hr',
    title: 'HR & staffing',
    subtitle: 'Employees, leave, payroll handoff.',
    modules: [
      {
        id: 'hr-core',
        title: 'HR desk',
        lessons: [
          { id: 'h1', title: 'Staff onboarding', summary: 'Profiles, documents, leave balances.', durationMin: 20, docPath: '/guides/hr-manager.md', module: 'hr' },
        ],
      },
    ],
  },
  {
    id: 'volunteer_coordinator',
    title: 'Volunteers & teams',
    subtitle: 'Sunday and event teams.',
    modules: [
      {
        id: 'vol-core',
        title: 'Team lead',
        lessons: [
          { id: 'v1', title: 'Coordinator first day', summary: 'Volunteers, attendance, Sunday.', durationMin: 12, docPath: '/guides/volunteer-coordinator.md', module: 'volunteers' },
        ],
      },
    ],
  },
  {
    id: 'member',
    title: 'Member community',
    subtitle: 'Portal, giving, and groups.',
    modules: [
      {
        id: 'member-core',
        title: 'Your church online',
        lessons: [
          { id: 'm1', title: 'Using your portal', summary: 'Profile, giving history, events.', durationMin: 8, docPath: '/guides/member.md', module: 'dashboard' },
        ],
      },
    ],
  },
];

const ACADEMY_PROGRESS_KEY = 'church_academy_progress_v1';

export function getAcademyProgress(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(ACADEMY_PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function setAcademyLessonComplete(lessonId: string, complete: boolean) {
  const p = getAcademyProgress();
  if (complete) p[lessonId] = true;
  else delete p[lessonId];
  localStorage.setItem(ACADEMY_PROGRESS_KEY, JSON.stringify(p));
}
