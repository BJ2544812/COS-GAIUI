export type WebsiteSectionType =
  | 'hero'
  | 'text'
  | 'image'
  | 'sermon_list'
  | 'event_list'
  | 'giving_cta'
  | 'contact_form'
  | 'stats_bar'
  | 'ministry_grid'
  | 'leadership_grid'
  | 'testimonials'
  | 'giving_impact'
  | 'qr_payment'
  | 'welcome_vision'
  | 'prayer_cta'
  | 'next_steps'
  | 'worship'
  | 'timeline'
  | 'values'
  | 'faq'
  | 'ministry_highlight'
  | 'pastoral_note'
  | 'vision_statement';

export type WebsiteWidgetType =
  | 'latest_sermons'
  | 'featured_events'
  | 'ministry_grid'
  | 'giving_campaigns'
  | 'leadership_grid'
  | 'campus_locations'
  | 'livestream_widget'
  | 'service_times';

export type WebsiteSection = {
  id: string;
  type: WebsiteSectionType;
  config: Record<string, unknown>;
  isVisible?: boolean;
  order?: number;
};

export type WebsiteSectionDefinition = {
  type: WebsiteSectionType;
  label: string;
  order: number;
  defaultConfig: Record<string, unknown>;
  editableFields: string[];
  supportedWidgets: WebsiteWidgetType[];
  themeCompatibility: ('light' | 'dark' | 'any')[];
};

export type WebsiteWidgetDefinition = {
  type: WebsiteWidgetType;
  label: string;
  defaultLimit?: number;
  supportsFiltering: boolean;
  supportsSorting: boolean;
  supportsFeatured: boolean;
};

export const WEBSITE_WIDGET_REGISTRY: Record<WebsiteWidgetType, WebsiteWidgetDefinition> = {
  latest_sermons: {
    type: 'latest_sermons',
    label: 'Latest Sermons',
    defaultLimit: 9,
    supportsFiltering: true,
    supportsSorting: true,
    supportsFeatured: true,
  },
  featured_events: {
    type: 'featured_events',
    label: 'Featured Events',
    defaultLimit: 10,
    supportsFiltering: true,
    supportsSorting: true,
    supportsFeatured: true,
  },
  ministry_grid: {
    type: 'ministry_grid',
    label: 'Ministry Grid',
    defaultLimit: 8,
    supportsFiltering: true,
    supportsSorting: true,
    supportsFeatured: true,
  },
  giving_campaigns: {
    type: 'giving_campaigns',
    label: 'Giving Campaigns',
    defaultLimit: 6,
    supportsFiltering: true,
    supportsSorting: true,
    supportsFeatured: true,
  },
  leadership_grid: {
    type: 'leadership_grid',
    label: 'Leadership Grid',
    defaultLimit: 6,
    supportsFiltering: true,
    supportsSorting: true,
    supportsFeatured: true,
  },
  campus_locations: {
    type: 'campus_locations',
    label: 'Campus Locations',
    defaultLimit: 10,
    supportsFiltering: true,
    supportsSorting: true,
    supportsFeatured: false,
  },
  livestream_widget: {
    type: 'livestream_widget',
    label: 'Livestream Widget',
    supportsFiltering: false,
    supportsSorting: false,
    supportsFeatured: true,
  },
  service_times: {
    type: 'service_times',
    label: 'Service Times',
    supportsFiltering: false,
    supportsSorting: false,
    supportsFeatured: false,
  },
};

export const WEBSITE_SECTION_REGISTRY: Record<WebsiteSectionType, WebsiteSectionDefinition> = {
  hero: {
    type: 'hero',
    label: 'Hero',
    order: 0,
    defaultConfig: { variant: 'centered', title: '', subtitle: '', buttonText: 'Plan Your Visit', overlayOpacity: 0.4 },
    editableFields: ['variant', 'title', 'subtitle', 'buttonText', 'secondaryButtonText', 'overlayOpacity', 'imageUrl'],
    supportedWidgets: ['service_times', 'livestream_widget'],
    themeCompatibility: ['any'],
  },
  text: {
    type: 'text',
    label: 'Text',
    order: 10,
    defaultConfig: { title: '', content: '', alignment: 'center' },
    editableFields: ['title', 'content', 'alignment'],
    supportedWidgets: [],
    themeCompatibility: ['any'],
  },
  image: {
    type: 'image',
    label: 'Image',
    order: 20,
    defaultConfig: { imageUrl: '', alt: '' },
    editableFields: ['imageUrl', 'alt'],
    supportedWidgets: [],
    themeCompatibility: ['any'],
  },
  sermon_list: {
    type: 'sermon_list',
    label: 'Sermons',
    order: 30,
    defaultConfig: { title: 'Latest Sermons', limit: 9, widgetType: 'latest_sermons' },
    editableFields: ['title', 'limit', 'widgetType'],
    supportedWidgets: ['latest_sermons'],
    themeCompatibility: ['any'],
  },
  event_list: {
    type: 'event_list',
    label: 'Events',
    order: 40,
    defaultConfig: { title: 'Upcoming Events', limit: 10, widgetType: 'featured_events' },
    editableFields: ['title', 'limit', 'widgetType'],
    supportedWidgets: ['featured_events'],
    themeCompatibility: ['any'],
  },
  giving_cta: {
    type: 'giving_cta',
    label: 'Giving CTA',
    order: 50,
    defaultConfig: { title: 'Give', description: 'Support the mission.', buttonText: 'Give now' },
    editableFields: ['title', 'description', 'buttonText'],
    supportedWidgets: [],
    themeCompatibility: ['any'],
  },
  contact_form: {
    type: 'contact_form',
    label: 'Contact',
    order: 60,
    defaultConfig: { title: 'Contact us', widgetType: 'campus_locations' },
    editableFields: ['title', 'email', 'phone', 'address', 'widgetType'],
    supportedWidgets: ['campus_locations', 'service_times'],
    themeCompatibility: ['any'],
  },
  stats_bar: { type: 'stats_bar', label: 'Stats Bar', order: 70, defaultConfig: { stats: [] }, editableFields: ['stats'], supportedWidgets: [], themeCompatibility: ['any'] },
  ministry_grid: { type: 'ministry_grid', label: 'Ministries', order: 80, defaultConfig: { title: 'Our Ministries', widgetType: 'ministry_grid' }, editableFields: ['title', 'ministries', 'widgetType'], supportedWidgets: ['ministry_grid'], themeCompatibility: ['any'] },
  leadership_grid: { type: 'leadership_grid', label: 'Leadership', order: 90, defaultConfig: { title: 'Leadership', widgetType: 'leadership_grid' }, editableFields: ['title', 'staff', 'widgetType'], supportedWidgets: ['leadership_grid'], themeCompatibility: ['any'] },
  testimonials: { type: 'testimonials', label: 'Testimonials', order: 100, defaultConfig: { title: 'Stories', items: [] }, editableFields: ['title', 'items'], supportedWidgets: [], themeCompatibility: ['any'] },
  giving_impact: { type: 'giving_impact', label: 'Giving Impact', order: 110, defaultConfig: { title: 'Giving Impact', widgetType: 'giving_campaigns' }, editableFields: ['title', 'campaigns', 'widgetType'], supportedWidgets: ['giving_campaigns'], themeCompatibility: ['any'] },
  qr_payment: { type: 'qr_payment', label: 'QR Payment', order: 120, defaultConfig: { title: 'Give Instantly via QR', fundName: 'General Fund' }, editableFields: ['title', 'fundName'], supportedWidgets: [], themeCompatibility: ['any'] },
  welcome_vision: { type: 'welcome_vision', label: 'Welcome Vision', order: 130, defaultConfig: { title: 'Welcome', mission: '', pastorMessage: '', pastorName: '' }, editableFields: ['title', 'mission', 'pastorMessage', 'pastorName', 'imageUrl'], supportedWidgets: [], themeCompatibility: ['any'] },
  prayer_cta: { type: 'prayer_cta', label: 'Prayer CTA', order: 140, defaultConfig: { title: 'How Can We Pray For You?', subtitle: '' }, editableFields: ['title', 'subtitle'], supportedWidgets: [], themeCompatibility: ['any'] },
  next_steps: { type: 'next_steps', label: 'Next Steps', order: 150, defaultConfig: { title: 'Your Next Step', steps: [] }, editableFields: ['title', 'steps'], supportedWidgets: [], themeCompatibility: ['any'] },
  worship: { type: 'worship', label: 'Worship', order: 160, defaultConfig: { title: 'Worship as a Lifestyle', imageUrl: '' }, editableFields: ['title', 'subtitle', 'imageUrl'], supportedWidgets: [], themeCompatibility: ['dark', 'any'] },
  timeline: { type: 'timeline', label: 'Timeline', order: 170, defaultConfig: { title: 'Our Story', events: [] }, editableFields: ['title', 'events'], supportedWidgets: [], themeCompatibility: ['any'] },
  values: { type: 'values', label: 'Values', order: 180, defaultConfig: { title: 'Our Values', values: [] }, editableFields: ['title', 'values'], supportedWidgets: [], themeCompatibility: ['any'] },
  faq: { type: 'faq', label: 'FAQ', order: 190, defaultConfig: { title: 'Common Questions', items: [] }, editableFields: ['title', 'items'], supportedWidgets: [], themeCompatibility: ['any'] },
  ministry_highlight: { type: 'ministry_highlight', label: 'Ministry Highlight', order: 200, defaultConfig: { title: '', subtitle: '', imageUrl: '', reversed: false }, editableFields: ['title', 'subtitle', 'imageUrl', 'reversed'], supportedWidgets: [], themeCompatibility: ['any'] },
  pastoral_note: { type: 'pastoral_note', label: 'Pastoral Note', order: 210, defaultConfig: { title: '', message: '', author: '' }, editableFields: ['title', 'message', 'author'], supportedWidgets: [], themeCompatibility: ['any'] },
  vision_statement: { type: 'vision_statement', label: 'Vision Statement', order: 220, defaultConfig: { title: '', subtitle: '' }, editableFields: ['title', 'subtitle'], supportedWidgets: [], themeCompatibility: ['any'] },
};

export const DEFAULT_WIDGET_BY_SECTION: Partial<Record<WebsiteSectionType, WebsiteWidgetType>> = {
  sermon_list: 'latest_sermons',
  event_list: 'featured_events',
  ministry_grid: 'ministry_grid',
  giving_impact: 'giving_campaigns',
  leadership_grid: 'leadership_grid',
  contact_form: 'campus_locations',
};

export function isWebsiteSectionType(value: string): value is WebsiteSectionType {
  return Object.prototype.hasOwnProperty.call(WEBSITE_SECTION_REGISTRY, value);
}

export function normalizeWebsiteSection(raw: unknown, index: number): WebsiteSection | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const typeRaw = typeof row.type === 'string' ? row.type : '';
  if (!isWebsiteSectionType(typeRaw)) return null;
  const def = WEBSITE_SECTION_REGISTRY[typeRaw];
  const configRaw = row.config && typeof row.config === 'object' ? (row.config as Record<string, unknown>) : {};
  return {
    id: typeof row.id === 'string' && row.id.trim() ? row.id : `section-${typeRaw}-${index}`,
    type: typeRaw,
    config: { ...def.defaultConfig, ...configRaw },
    isVisible: row.isVisible === false ? false : true,
    order: typeof row.order === 'number' ? row.order : def.order + index,
  };
}

export function normalizeWebsiteSections(raw: unknown): WebsiteSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, idx) => normalizeWebsiteSection(item, idx))
    .filter((item): item is WebsiteSection => Boolean(item));
}

export function createWebsiteSection(type: WebsiteSectionType, idSeed: string): WebsiteSection {
  const def = WEBSITE_SECTION_REGISTRY[type];
  return {
    id: idSeed,
    type,
    config: { ...def.defaultConfig },
    isVisible: true,
    order: def.order,
  };
}

type WidgetBindContext = {
  sermons?: unknown[];
  events?: unknown[];
  ministries?: unknown[];
  campaigns?: unknown[];
  campuses?: unknown[];
  leadership?: unknown[];
  settings?: {
    organization?: {
      address?: string;
      email?: string;
      phone?: string;
      serviceTimes?: string;
      livestreamUrl?: string;
    };
  } | null;
};

export function bindWebsiteSectionData(section: WebsiteSection, ctx: WidgetBindContext): WebsiteSection {
  const widgetType = (section.config.widgetType as WebsiteWidgetType | undefined) || DEFAULT_WIDGET_BY_SECTION[section.type];
  if (!widgetType) return section;
  const nextConfig: Record<string, unknown> = { ...section.config, widgetType };
  if (widgetType === 'latest_sermons') {
    nextConfig.limit = Number(section.config.limit) || WEBSITE_WIDGET_REGISTRY.latest_sermons.defaultLimit || 9;
  } else if (widgetType === 'featured_events') {
    nextConfig.limit = Number(section.config.limit) || WEBSITE_WIDGET_REGISTRY.featured_events.defaultLimit || 10;
  } else if (widgetType === 'ministry_grid' && (!Array.isArray(section.config.ministries) || section.config.ministries.length === 0)) {
    nextConfig.ministries = Array.isArray(ctx.ministries) ? ctx.ministries : [];
  } else if (widgetType === 'giving_campaigns' && (!Array.isArray(section.config.campaigns) || section.config.campaigns.length === 0)) {
    nextConfig.campaigns = Array.isArray(ctx.campaigns) ? ctx.campaigns : [];
  } else if (
    section.type === 'giving_impact' &&
    (!Array.isArray(section.config.campaigns) || section.config.campaigns.length === 0) &&
    Array.isArray(ctx.campaigns) &&
    ctx.campaigns.length > 0
  ) {
    nextConfig.campaigns = ctx.campaigns;
  } else if (widgetType === 'leadership_grid' && (!Array.isArray(section.config.staff) || section.config.staff.length === 0)) {
    if (Array.isArray(ctx.leadership) && ctx.leadership.length > 0) {
      nextConfig.staff = ctx.leadership;
    }
  } else if (widgetType === 'campus_locations') {
    const campuses = Array.isArray(ctx.campuses) ? ctx.campuses : [];
    if (!Array.isArray(section.config.campuses) || section.config.campuses.length === 0) {
      nextConfig.campuses = campuses;
    }
    if (!section.config.address && ctx.settings?.organization?.address) nextConfig.address = ctx.settings.organization.address;
    if (!section.config.address && campuses.length > 0) {
      const firstAddress = (campuses[0] as { address?: unknown })?.address;
      if (typeof firstAddress === 'string' && firstAddress.trim()) nextConfig.address = firstAddress.trim();
    }
    if (!section.config.email && ctx.settings?.organization?.email) nextConfig.email = ctx.settings.organization.email;
    if (!section.config.phone && ctx.settings?.organization?.phone) nextConfig.phone = ctx.settings.organization.phone;
  } else if (widgetType === 'service_times' && !section.config.serviceTimes && ctx.settings?.organization?.serviceTimes) {
    nextConfig.serviceTimes = ctx.settings.organization.serviceTimes;
  } else if (widgetType === 'livestream_widget' && !section.config.livestreamUrl && ctx.settings?.organization?.livestreamUrl) {
    nextConfig.livestreamUrl = ctx.settings.organization.livestreamUrl;
  }
  return { ...section, config: nextConfig };
}

export function getWebsiteSectionPalette() {
  return Object.values(WEBSITE_SECTION_REGISTRY)
    .sort((a, b) => a.order - b.order)
    .map((def) => ({ type: def.type, label: def.label }));
}
