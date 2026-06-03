/**
 * Maps Kingdom OS ERP records into website section/widget shapes.
 * Shared by public site and builder preview — single normalized binding layer.
 */
import { SERVER_ROOT } from '@/lib/apiConfig';

const MINISTRY_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=1000';
const LEADER_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1000';

export type WebsiteMinistryRow = {
  id?: string;
  name?: string;
  title: string;
  description: string;
  schedule: string;
  leader: string;
  image: string;
};

export type WebsiteLeaderRow = {
  name: string;
  role: string;
  image: string;
  bio?: string;
};

export type WebsiteCampaignRow = {
  title: string;
  progress: number;
  target: string;
  current: string;
  desc: string;
};

export type WebsiteEventRow = {
  id: string;
  name: string;
  type: string;
  date: string;
  description?: string;
  location?: string;
};

export type WebsiteSermonRow = {
  id: string;
  title: string;
  speaker: string | null;
  date: string;
  series?: string;
  scripture?: string;
  videoUrl?: string;
  thumbnail?: string;
  description?: string;
};

function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url || !String(url).trim()) return undefined;
  const raw = String(url).trim();
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return `${SERVER_ROOT}${raw}`;
  return raw;
}

function formatMoney(amount: number, currency: string): string {
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '';
  const n = Math.round(amount);
  if (sym === '₹') return `₹${n.toLocaleString('en-IN')}`;
  if (sym === '$') return `$${n.toLocaleString('en-US')}`;
  return `${n.toLocaleString()} ${currency}`;
}

export function mapMinistriesForWebsite(
  ministries: Array<{
    id?: string;
    name?: string;
    leaderName?: string | null;
    leaderRole?: string | null;
    leaderImageUrl?: string | null;
    activeServingCount?: number;
  }>,
): WebsiteMinistryRow[] {
  return ministries.map((m) => {
    const title = String(m.name || 'Ministry').trim() || 'Ministry';
    const leader = m.leaderName?.trim() || 'Ministry Team';
    const leaderDetail = m.leaderRole ? `${leader} (${m.leaderRole})` : leader;
    const countNote =
      typeof m.activeServingCount === 'number' && m.activeServingCount > 0
        ? `${m.activeServingCount} active volunteers serving.`
        : '';
    return {
      id: m.id,
      name: title,
      title,
      description: `Discover community and discipleship in our ${title}.${countNote ? ` ${countNote}` : ''}`,
      schedule: 'Sundays & midweek gatherings',
      leader: leaderDetail,
      image: resolveMediaUrl(m.leaderImageUrl) || MINISTRY_FALLBACK_IMAGE,
    };
  });
}

export function mapLeadershipForWebsite(
  members: Array<{ name?: string; role?: string | null; profileImageUrl?: string | null; image?: string | null }>,
): WebsiteLeaderRow[] {
  return members.map((m) => ({
    name: String(m.name || 'Team Member').trim(),
    role: String(m.role || 'Leader').trim(),
    image: resolveMediaUrl(m.profileImageUrl || m.image) || LEADER_FALLBACK_IMAGE,
    bio: '',
  }));
}

export function mapCampaignsForWebsite(
  campaigns: Array<{ name?: string; title?: string; goal?: number | null; raised?: number; progress?: number }>,
  currency = 'INR',
): WebsiteCampaignRow[] {
  return campaigns.map((c) => {
    const goal = Number(c.goal) || 0;
    const raised = Number(c.raised) || 0;
    const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : raised > 0 ? 100 : 0;
    const label = String(c.title || c.name || 'Campaign').trim();
    return {
      title: label,
      progress: typeof c.progress === 'number' ? c.progress : progress,
      target: goal > 0 ? formatMoney(goal, currency) : 'Open Goal',
      current: formatMoney(raised, currency),
      desc: `Your generosity fuels ${label} across our church family.`,
    };
  });
}

export function mapEventsForWebsite(
  events: Array<{ id: string; name: string; type: string; date: string; location?: string | null; description?: string | null }>,
): WebsiteEventRow[] {
  return events.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    date: e.date,
    location: e.location || undefined,
    description: e.description || undefined,
  }));
}

export function mapSermonsForWebsite(
  sermons: Array<{
    id: string;
    title: string;
    speaker?: string | null;
    date: Date | string;
    scripture?: string | null;
    videoUrl?: string | null;
    thumbnail?: string | null;
    description?: string | null;
  }>,
): WebsiteSermonRow[] {
  return sermons.map((s) => {
    const desc = s.description || '';
    const seriesMatch = desc.match(/\[series:([^\]]+)\]/i) || desc.match(/^Series:\s*(.+)$/im);
    const series = seriesMatch ? String(seriesMatch[1]).trim() : undefined;
    return {
      id: s.id,
      title: s.title,
      speaker: s.speaker ?? null,
      date: s.date instanceof Date ? s.date.toISOString() : String(s.date),
      series,
      scripture: s.scripture || undefined,
      videoUrl: s.videoUrl || undefined,
      thumbnail: resolveMediaUrl(s.thumbnail),
      description: desc.replace(/\[series:[^\]]+\]/gi, '').trim() || undefined,
    };
  });
}

export function formatEventDateParts(isoDate: string): { weekday: string; month: string; day: string; timeLabel: string } {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) {
    return { weekday: 'TBD', month: 'TBD', day: '—', timeLabel: 'See calendar' };
  }
  const weekday = d.toLocaleString('en-US', { weekday: 'long' });
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = String(d.getDate());
  const timeLabel = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
  return { weekday, month, day, timeLabel };
}
