/**
 * Ultimate Church OS — ERP design tokens (frontend only).
 * Use these class bundles for consistent spacing, typography, and surfaces.
 */
export const ds = {
  page: 'module-page space-y-8 min-w-0 animate-in fade-in duration-500 pb-12',
  pageTight: 'module-page space-y-6 min-w-0 pb-8',

  pageTitle: 'text-2xl md:text-3xl font-black text-slate-900 tracking-tight',
  pageSubtitle: 'text-sm text-slate-500 font-medium mt-1 max-w-2xl',
  sectionTitle: 'text-sm font-black text-slate-800',
  sectionSubtitle: 'text-xs text-slate-400 font-medium mt-0.5',

  kpiValue: 'text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none',
  kpiLabel: 'text-[10px] font-black text-slate-400 uppercase tracking-widest',

  card: 'bg-white rounded-2xl border border-slate-100 shadow-sm',
  cardPadding: 'p-5 md:p-6',
  cardHover: 'hover:shadow-md transition-shadow',

  tableHead:
    'text-[11px] font-bold uppercase tracking-wider text-slate-500',
  tableCell: 'text-sm text-slate-700',

  tabBar: 'flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-full max-w-full overflow-x-auto',
  tabItem: (active: boolean) =>
    `px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 ${
      active ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`,

  focusRing:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-2',

  formLabel: 'text-xs font-bold text-slate-600',
  formInput:
    'w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:border-brand-primary/30',
  formInputMuted:
    'w-full h-11 rounded-xl border-none bg-slate-50 px-4 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40',

  avatar: {
    sm: 'sm' as const,
    md: 'default' as const,
    lg: 'lg' as const,
    profile: 'xl' as const,
    hero: '2xl' as const,
  },
} as const;
