import type { ERPModule, ModuleStatus } from '@/types';

/** User-facing readiness labels (Phase 7). */
export type ModuleReadinessLabel = 'Production Ready' | 'In Progress' | 'Coming Soon';

export function readinessLabelFromStatus(status: ModuleStatus): ModuleReadinessLabel {
  switch (status) {
    case 'live':
    case 'operational':
      return 'Production Ready';
    case 'partial':
    case 'backend-ready':
    case 'prototype':
    case 'experimental':
      return 'In Progress';
    case 'placeholder':
    case 'planned':
      return 'Coming Soon';
    default:
      return 'In Progress';
  }
}

export const MODULE_STATUS_BY_ID: Record<ERPModule, ModuleStatus> = {
  dashboard: 'partial',
  profile: 'live',
  members: 'live',
  families: 'partial',
  volunteers: 'live',
  workforce: 'live',
  hr: 'live',
  'small-groups': 'live',
  pathways: 'live',
  discipleship: 'partial',
  events: 'operational',
  attendance: 'operational',
  services: 'operational',
  'sunday-services': 'live',
  'sunday-mode': 'live',
  worship: 'live',
  outreach: 'live',
  missions: 'placeholder',
  structure: 'live',
  giving: 'live',
  finance: 'live',
  budgets: 'operational',
  funds: 'operational',
  assets: 'live',
  documents: 'live',
  vendors: 'operational',
  sermons: 'operational',
  content: 'operational',
  communication: 'partial',
  notifications: 'partial',
  mobile: 'placeholder',
  website: 'operational',
  pages: 'placeholder',
  forms: 'placeholder',
  'media-library': 'placeholder',
  'landing-pages': 'placeholder',
  seo: 'placeholder',
  analytics: 'partial',
  academy: 'live',
  engagement: 'partial',
  'workflow-monitor': 'operational',
  'event-admin': 'operational',
  'audit-logs': 'live',
  settings: 'live',
  permissions: 'live',
  'feature-flags': 'live',
  'admin-center': 'live',
  'tenant-settings': 'placeholder',
  integrations: 'placeholder',
};

export function getModuleStatus(module: ERPModule): ModuleStatus {
  return MODULE_STATUS_BY_ID[module] ?? 'partial';
}

export function getModuleReadiness(module: ERPModule): ModuleReadinessLabel {
  return readinessLabelFromStatus(getModuleStatus(module));
}
