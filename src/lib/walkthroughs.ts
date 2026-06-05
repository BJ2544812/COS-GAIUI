import type { ERPModule } from '@/types';
import { buildAdminPath } from '@/lib/adminNavigation';

export type WalkthroughTrackId =
  | 'senior_pastor'
  | 'church_admin'
  | 'finance'
  | 'hr'
  | 'volunteer_coordinator'
  | 'small_group_leader'
  | 'member';

export type WalkthroughStop = {
  id: string;
  title: string;
  /** Step 3 — what to do in the product */
  taskInstruction: string;
  /** Step 4 — why it matters for ministry */
  whyItMatters: string;
  module?: ERPModule;
  tab?: string;
  portalPath?: string;
};

export type WalkthroughTrack = {
  id: WalkthroughTrackId;
  title: string;
  /** Step 1 — role purpose (shown once at top) */
  whatThisRoleDoes: string;
  estimatedMinutes: number;
  stops: WalkthroughStop[];
};

const STORAGE_KEY = 'church_walkthrough_progress_v1';

export const WALKTHROUGH_TRACKS: WalkthroughTrack[] = [
  {
    id: 'senior_pastor',
    title: 'Senior Pastor',
    whatThisRoleDoes:
      'Shepherd the congregation — see church health, care for people, steward resources, and stay ready for Sunday.',
    estimatedMinutes: 5,
    stops: [
      {
        id: 'sp-1',
        title: 'View church health dashboard',
        taskInstruction: 'Open Home and scan the pastoral lens — attendance, giving, and ministry signals.',
        whyItMatters: 'Leadership starts with a truthful picture of how the church is doing this week.',
        module: 'dashboard',
      },
      {
        id: 'sp-2',
        title: 'Review attendance trends',
        taskInstruction: 'Open Attendance or Reports and compare recent Sunday participation.',
        whyItMatters: 'Gathering patterns reveal engagement and who may need pastoral contact.',
        module: 'attendance',
      },
      {
        id: 'sp-3',
        title: 'Review pastoral care cases',
        taskInstruction: 'Open Pastoral Care and read open cases and follow-ups.',
        whyItMatters: 'Care keeps trust — pastors coordinate who is visiting, calling, or praying.',
        module: 'discipleship',
      },
      {
        id: 'sp-4',
        title: 'Review Sunday service readiness',
        taskInstruction: 'Open Sunday Service and check today’s worship, teams, and attention items.',
        whyItMatters: 'Sunday is the rhythm of the church; readiness reduces last-minute chaos.',
        module: 'sunday-mode',
      },
      {
        id: 'sp-5',
        title: 'Review giving summary',
        taskInstruction: 'Open Giving for recent gifts and stewardship trends (not voucher entry).',
        whyItMatters: 'Generosity reflects spiritual health and funds the mission.',
        module: 'giving',
      },
    ],
  },
  {
    id: 'church_admin',
    title: 'Church Administrator',
    whatThisRoleDoes:
      'Keep daily operations moving — events, volunteers, attendance, communications, and church settings.',
    estimatedMinutes: 8,
    stops: [
      {
        id: 'ca-1',
        title: 'Operations home',
        taskInstruction: 'Open Home (operations view) and note this week’s services and gaps.',
        whyItMatters: 'Administrators coordinate across teams from one weekly picture.',
        module: 'dashboard',
      },
      {
        id: 'ca-2',
        title: 'Plan an event',
        taskInstruction: 'Open Events, create or open a service, and review setup checklist.',
        whyItMatters: 'Most church activity flows through event records and workspaces.',
        module: 'events',
      },
      {
        id: 'ca-3',
        title: 'Sunday service desk',
        taskInstruction: 'Open Sunday Service and select today’s worship gathering.',
        whyItMatters: 'Service day needs a single live cockpit for flow and teams.',
        module: 'sunday-mode',
      },
      {
        id: 'ca-4',
        title: 'Volunteer teams',
        taskInstruction: 'Open Volunteers and confirm roles for the upcoming service.',
        whyItMatters: 'People serving are the backbone of Sunday and special events.',
        module: 'volunteers',
      },
      {
        id: 'ca-5',
        title: 'Church settings',
        taskInstruction: 'Open Settings and verify organization profile and key defaults.',
        whyItMatters: 'Correct settings keep receipts, emails, and reports accurate.',
        module: 'settings',
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finance Manager',
    whatThisRoleDoes:
      'Record gifts, manage the ledger, approve spending, and report to leadership and auditors.',
    estimatedMinutes: 10,
    stops: [
      {
        id: 'fi-1',
        title: 'Record gifts',
        taskInstruction: 'Open Giving and record a sample gift or review recent donations.',
        whyItMatters: 'Stewardship begins with accurate, timely gift entry.',
        module: 'giving',
      },
      {
        id: 'fi-2',
        title: 'Finance desk',
        taskInstruction: 'Open Finance → Vouchers and create or open a draft voucher.',
        whyItMatters: 'Expenses must be documented before payment and posting.',
        module: 'finance',
        tab: 'vouchers',
      },
      {
        id: 'fi-3',
        title: 'Approve voucher',
        taskInstruction: 'Open Approvals (if permitted) and review pending vouchers.',
        whyItMatters: 'Separation of duties protects the church from errors and fraud.',
        module: 'finance',
        tab: 'approvals',
      },
      {
        id: 'fi-4',
        title: 'Budgets & funds',
        taskInstruction: 'Open Budgets and review fund balances vs plan.',
        whyItMatters: 'Leadership allocates resources by ministry and project.',
        module: 'budgets',
      },
      {
        id: 'fi-5',
        title: 'Reconciliation',
        taskInstruction: 'Open Finance → Reconciliation and scan unmatched lines.',
        whyItMatters: 'Bank and ledger must agree for trustworthy financial statements.',
        module: 'finance',
        tab: 'reconciliation',
      },
    ],
  },
  {
    id: 'hr',
    title: 'HR Manager',
    whatThisRoleDoes:
      'Manage paid staff — employment records, leave, documents, and payroll handoff to finance.',
    estimatedMinutes: 7,
    stops: [
      {
        id: 'hr-1',
        title: 'HR overview',
        taskInstruction: 'Open HR & Staff and review the dashboard counts.',
        whyItMatters: 'Staff operations affect Sunday quality and legal compliance.',
        module: 'hr',
      },
      {
        id: 'hr-2',
        title: 'Staff directory',
        taskInstruction: 'Open the Staff directory tab and open one employment profile.',
        whyItMatters: 'Job data must stay current for payroll and pastoral accountability.',
        module: 'hr',
        tab: 'directory',
      },
      {
        id: 'hr-3',
        title: 'Leave requests',
        taskInstruction: 'Open Leave and review pending requests.',
        whyItMatters: 'Coverage planning protects Sundays and office hours.',
        module: 'hr',
      },
      {
        id: 'hr-4',
        title: 'Payroll with finance',
        taskInstruction: 'Open Vendors & Payroll or Finance payroll runs (as configured).',
        whyItMatters: 'Payroll must match HR records and be posted to the ledger.',
        module: 'vendors',
      },
    ],
  },
  {
    id: 'volunteer_coordinator',
    title: 'Volunteer Coordinator',
    whatThisRoleDoes:
      'Fill teams for Sunday and events, track check-in, and support leaders on service day.',
    estimatedMinutes: 6,
    stops: [
      {
        id: 'vc-1',
        title: 'Volunteer roster',
        taskInstruction: 'Open Volunteers and filter by an upcoming event.',
        whyItMatters: 'Clear rosters prevent gaps at doors, kids ministry, and platform.',
        module: 'volunteers',
      },
      {
        id: 'vc-2',
        title: 'Sunday service teams',
        taskInstruction: 'Open Sunday Service → Teams section for today’s service.',
        whyItMatters: 'Live visibility shows who is present, late, or missing.',
        module: 'sunday-mode',
      },
      {
        id: 'vc-3',
        title: 'Attendance check-in',
        taskInstruction: 'Open Attendance and run or review today’s session.',
        whyItMatters: 'Counts encourage volunteers and inform pastors.',
        module: 'attendance',
      },
      {
        id: 'vc-4',
        title: 'Event workspace',
        taskInstruction: 'Open Events and an event detail for roster edits.',
        whyItMatters: 'Special events use the same volunteer engine as Sunday.',
        module: 'events',
      },
    ],
  },
  {
    id: 'small_group_leader',
    title: 'Small Group Leader',
    whatThisRoleDoes:
      'Lead a home group — know your members, record group attendance, and escalate pastoral needs.',
    estimatedMinutes: 5,
    stops: [
      {
        id: 'sg-1',
        title: 'Your group',
        taskInstruction: 'Open Small Groups and select your group roster.',
        whyItMatters: 'Discipleship happens in consistent, known community.',
        module: 'small-groups',
      },
      {
        id: 'sg-2',
        title: 'Member care',
        taskInstruction: 'Open Members and review profiles for group participants.',
        whyItMatters: 'Leaders are often the first to notice pastoral needs.',
        module: 'members',
      },
      {
        id: 'sg-3',
        title: 'Group attendance',
        taskInstruction: 'Open Attendance and record or review your group meeting.',
        whyItMatters: 'Attendance patterns show who may be drifting.',
        module: 'attendance',
      },
      {
        id: 'sg-4',
        title: 'Pastoral handoff',
        taskInstruction: 'Open Pastoral Care to log or view a care note (as permitted).',
        whyItMatters: 'Serious needs should reach pastors with context.',
        module: 'discipleship',
      },
    ],
  },
  {
    id: 'member',
    title: 'Member',
    whatThisRoleDoes:
      'Stay connected — profile, giving, groups, and volunteer schedule through the member portal.',
    estimatedMinutes: 4,
    stops: [
      {
        id: 'mb-1',
        title: 'Your portal',
        taskInstruction: 'Open the member portal and review your profile.',
        whyItMatters: 'Members own their contact info and see their church activity.',
        portalPath: '/portal',
      },
      {
        id: 'mb-2',
        title: 'Give online',
        taskInstruction: 'Visit the giving page and review options (test mode if enabled).',
        whyItMatters: 'Digital giving supports consistent stewardship.',
        portalPath: '/donate',
      },
      {
        id: 'mb-3',
        title: 'Church website',
        taskInstruction: 'Open the public website home page for service times.',
        whyItMatters: 'Members invite friends to the same information visitors see.',
        portalPath: '/',
      },
    ],
  },
];

/** Flat step ids for progress storage (one checkbox per stop). */
export function getAllWalkthroughStepIds(): string[] {
  return WALKTHROUGH_TRACKS.flatMap((t) => t.stops.map((s) => s.id));
}

export function getWalkthroughProgress(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function setWalkthroughStepDone(stepId: string, done: boolean) {
  const progress = getWalkthroughProgress();
  if (done) progress[stepId] = true;
  else delete progress[stepId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetWalkthroughProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

export function stopTargetHref(stop: WalkthroughStop): string {
  if (stop.portalPath) return stop.portalPath;
  if (stop.module) return buildAdminPath({ module: stop.module, tab: stop.tab });
  return '/admin';
}

export function trackCompletionPercent(track: WalkthroughTrack): number {
  const progress = getWalkthroughProgress();
  const done = track.stops.filter((s) => progress[s.id]).length;
  return track.stops.length ? Math.round((done / track.stops.length) * 100) : 0;
}

export function getNextWalkthroughStop(track: WalkthroughTrack): WalkthroughStop | null {
  const progress = getWalkthroughProgress();
  return track.stops.find((s) => !progress[s.id]) ?? null;
}
