/**
 * Public website + registration settings stored on Event.opsConfig.public
 * (no schema migration; kept separate from live-ops keys at opsConfig root).
 */

export type EventPublicRegistration = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
};

export type EventPublicProfile = {
  publishedToWebsite?: boolean;
  publicDescription?: string;
  bannerImageUrl?: string;
  thumbnailImageUrl?: string;
  speaker?: string;
  category?: string;
  acceptsRegistration?: boolean;
  capacity?: number;
  registrations?: EventPublicRegistration[];
};

export type EventOpsConfigWithPublic = {
  public?: EventPublicProfile;
  [key: string]: unknown;
};

export function parseEventOpsConfig(raw: unknown): EventOpsConfigWithPublic {
  if (!raw || typeof raw !== 'object') return {};
  return raw as EventOpsConfigWithPublic;
}

export function getEventPublicProfile(raw: unknown): EventPublicProfile {
  return parseEventOpsConfig(raw).public ?? {};
}

export function mergeEventPublicProfile(
  existing: unknown,
  patch: Partial<EventPublicProfile>,
): EventOpsConfigWithPublic {
  const base = parseEventOpsConfig(existing);
  const prev = base.public ?? {};
  return {
    ...base,
    public: {
      ...prev,
      ...patch,
      registrations: patch.registrations ?? prev.registrations,
    },
  };
}

export function publicRegistrationCount(raw: unknown): number {
  const regs = getEventPublicProfile(raw).registrations;
  return Array.isArray(regs) ? regs.length : 0;
}

export function isPublishedToWebsite(raw: unknown): boolean {
  return getEventPublicProfile(raw).publishedToWebsite === true;
}

export function registrationOpenForPublic(event: {
  registrationOpen?: boolean;
  status?: string;
  opsConfig?: unknown;
}): boolean {
  const pub = getEventPublicProfile(event.opsConfig);
  if (!pub.acceptsRegistration) return false;
  if (event.registrationOpen) return true;
  const s = event.status ?? 'DRAFT';
  return s === 'REGISTRATION_OPEN' || s === 'APPROVED' || s === 'ACTIVE';
}
