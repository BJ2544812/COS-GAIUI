import { randomUUID } from 'node:crypto';
import { WebsiteRepository } from '../repositories/WebsiteRepository.js';
import { Prisma } from '@prisma/client';
import { WEBSITE_TEMPLATES } from '../utils/websiteDefaults.js';
import { prisma } from '../utils/prisma.js';
import {
  getMergedOrganizationSettings,
  getMergedFinancialSettings,
} from '../utils/mergeTenantSettings.js';
import { SettingsRepository } from '../repositories/SettingsRepository.js';
import { CodedError } from '../utils/apiErrors.js';
import { normalizeWebsiteSections } from '../../lib/websiteEngine.js';

export class WebsiteService {
  static async ensureWebsiteOperationalSeedData(tenantId: string) {
    const [ministryCount, sermonCount, eventCount, campaignCount] = await Promise.all([
      prisma.ministry.count({ where: { tenantId } }),
      prisma.sermon.count({ where: { tenantId } }),
      prisma.event.count({ where: { tenantId } }),
      prisma.campaign.count({ where: { tenantId } }),
    ]);

    if (ministryCount === 0) {
      await prisma.ministry.createMany({
        data: [
          { tenantId, name: 'Kids Ministry' },
          { tenantId, name: 'Youth Ministry' },
          { tenantId, name: 'Worship Ministry' },
          { tenantId, name: 'Care Ministry' },
        ],
      });
    }

    if (sermonCount === 0) {
      await prisma.sermon.createMany({
        data: [
          {
            tenantId,
            title: 'Living in Grace and Truth',
            speaker: 'Pastoral Team',
            isPublished: true,
            description: 'A practical teaching on discipleship and daily faith.',
          },
          {
            tenantId,
            title: 'Faithful Stewardship',
            speaker: 'Executive Pastor',
            isPublished: true,
            description: 'How generosity powers ministry impact.',
          },
        ],
      });
    }

    if (eventCount === 0) {
      const now = new Date();
      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
      nextSunday.setHours(9, 0, 0, 0);
      await prisma.event.createMany({
        data: [
          {
            tenantId,
            name: 'Sunday Worship Experience',
            type: 'Service',
            date: nextSunday,
            location: 'Main Auditorium',
          },
          {
            tenantId,
            name: 'Prayer Night',
            type: 'Special',
            date: new Date(nextSunday.getTime() + 3 * 24 * 60 * 60 * 1000),
            location: 'Chapel Hall',
          },
        ],
      });
    }

    if (campaignCount === 0) {
      await prisma.campaign.createMany({
        data: [
          {
            tenantId,
            name: 'Local Outreach',
            goal: 250000,
          },
        ],
      });
    }
  }

  static async ensureWebsiteInstalled(tenantId: string) {
    const existing = await prisma.pageData.count({ where: { tenantId } });
    if (existing > 0) return;
    try {
      await this.applyTemplate(tenantId, 'flagship-v2');
    } catch (error) {
      // Another concurrent request may have installed template first.
      const after = await prisma.pageData.count({ where: { tenantId } });
      if (after === 0) throw error;
    }
  }

  static async createPageData(tenantId: string, body: unknown) {
    if (body == null || typeof body !== 'object') {
      throw new CodedError('BAD_INPUT', 'Invalid request body');
    }
    const o = body as Record<string, unknown>;
    const slug = typeof o.slug === 'string' ? o.slug.trim().toLowerCase() : '';
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    const content =
      typeof o.content === 'string'
        ? o.content
        : JSON.stringify(o.content ?? []);
    if (!slug || !title) {
      throw new CodedError('BAD_INPUT', 'slug and title are required');
    }
    const isPublished = typeof o.isPublished === 'boolean' ? o.isPublished : false;
    return WebsiteRepository.createPageData(tenantId, {
      slug,
      title,
      content,
      isPublished,
    } as Omit<Prisma.PageDataCreateInput, 'tenant'>);
  }

  static async getPages(tenantId: string, onlyPublished: boolean = false) {
    await this.ensureWebsiteInstalled(tenantId);
    const pages = await WebsiteRepository.getPages(tenantId);
    if (onlyPublished) {
      return pages.filter((p) => p.isPublished);
    }
    return pages;
  }

  static async getPageBySlug(tenantId: string, slug: string) {
    await this.ensureWebsiteInstalled(tenantId);
    return WebsiteRepository.getPageBySlug(tenantId, slug);
  }

  /** Public site: published pages only (no silent auto-create; apply a template or create pages explicitly). */
  static async getPublicPageBySlug(tenantId: string, slug: string) {
    await this.ensureWebsiteInstalled(tenantId);
    const s = String(slug || '').trim().toLowerCase() || 'home';
    let page = await WebsiteRepository.getPageBySlug(tenantId, s);
    if (page && !page.isPublished) {
      page = null;
    }
    return page;
  }

  /** Public listing: only events with Publish to Website enabled (tenant-scoped, no auth). */
  static async getPublicEvents(tenantId: string, limit = 20) {
    const { EventPublicService } = await import('./EventPublicService.js');
    const rows = await EventPublicService.listPublishedEvents(tenantId, limit);
    return rows.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      date: e.date,
      location: e.location,
      description: e.description,
      imageUrl: e.imageUrl,
      registrationUrl: e.registrationOpen ? `/events/${e.id}` : undefined,
      recurring: false,
    }));
  }

  /** Staff and volunteer leaders for public leadership sections (presentation only). */
  static async getPublicLeadership(tenantId: string, limit = 12) {
    const cap = Math.min(Math.max(Number(limit) || 12, 1), 24);
    const { isLeadershipRole, servingTierForRole, tierSortIndex } = await import('../utils/servingRoles.js');

    const [stageLeaders, servingLeaders] = await Promise.all([
      prisma.member.findMany({
        where: {
          tenantId,
          status: 'Active',
          growthStage: { in: ['Staff', 'Leader', 'CoreTeam'] },
        },
        select: { id: true, name: true, role: true, profileImageUrl: true, growthStage: true },
        orderBy: { name: 'asc' },
        take: cap,
      }),
      prisma.memberResponsibility.findMany({
        where: { tenantId, status: 'Active' },
        include: { member: { select: { id: true, name: true, role: true, profileImageUrl: true, growthStage: true } } },
        take: cap * 3,
      }),
    ]);

    const seen = new Set<string>();
    const rows: { name: string; role: string; image: string | null; bio: string; tier: string }[] = [];

    const push = (m: { id: string; name: string; role: string; image: string | null }) => {
      if (seen.has(m.id) || rows.length >= cap) return;
      seen.add(m.id);
      rows.push({ name: m.name, role: m.role, image: m.image, bio: '', tier: servingTierForRole(m.role) });
    };

    for (const m of stageLeaders) {
      push({
        id: m.id,
        name: m.name,
        role: m.role?.trim() || m.growthStage || 'Leader',
        image: m.profileImageUrl,
      });
    }

    const ministryNames = new Map<string, string>();
    const ministries = await prisma.ministry.findMany({ where: { tenantId }, select: { id: true, name: true } });
    for (const min of ministries) ministryNames.set(min.id, min.name);

    for (const a of servingLeaders) {
      if (!a.member || !isLeadershipRole(a.role)) continue;
      const entityLabel =
        a.entityType === 'Ministry' && a.entityId
          ? ministryNames.get(a.entityId) ?? 'Ministry'
          : a.entityType;
      push({
        id: a.member.id,
        name: a.member.name,
        role: `${a.role} · ${entityLabel}`,
        image: a.member.profileImageUrl,
      });
    }

    rows.sort((a, b) => tierSortIndex(a.tier) - tierSortIndex(b.tier));
    return rows.map(({ tier: _t, ...rest }) => rest);
  }

  /** Campaigns with raised totals for giving impact widgets. */
  static async getPublicCampaigns(tenantId: string) {
    const fin = await getMergedFinancialSettings(tenantId);
    const currency = fin.currency || 'INR';
    const campaigns = await prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        donations: { select: { amount: true } },
      },
    });
    return campaigns.map((c) => {
      const raised = c.donations.reduce(
        (sum, d) => sum + Number(d.amount?.toString?.() ?? d.amount ?? 0),
        0,
      );
      const goal = Number(c.goal) || 0;
      const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : raised > 0 ? 100 : 0;
      return {
        id: c.id,
        name: c.name,
        title: c.name,
        goal,
        raised,
        progress,
        currency,
      };
    });
  }

  /** Public prayer intake — stored in discipleship module, no auth required. */
  static async createPublicPrayerRequest(
    tenantId: string,
    body: { content?: string; requesterName?: string; email?: string; isPrivate?: boolean },
  ) {
    const content = String(body.content ?? '').trim();
    if (!content) {
      throw new CodedError('BAD_INPUT', 'Prayer request content is required');
    }
    const requesterName = String(body.requesterName ?? '').trim();
    const composed =
      requesterName.length > 0
        ? `${content}\n\n— ${requesterName}${body.email ? ` (${String(body.email).trim()})` : ''}`
        : content;
    return prisma.prayerRequest.create({
      data: {
        tenantId,
        content: composed,
        visibility: body.isPrivate ? 'PASTORAL' : 'PUBLIC',
        status: 'Active',
      },
    });
  }

  static async ensureDefaultHomePage(tenantId: string) {
    const sections = [
      {
        id: randomUUID(),
        type: 'hero' as const,
        config: {
          variant: 'centered',
          title: 'Welcome',
          subtitle: 'We are glad you are here. Join us this Sunday.',
          buttonText: 'Plan your visit',
          overlayOpacity: 0.55,
        },
      },
      {
        id: randomUUID(),
        type: 'text' as const,
        config: {
          title: 'About',
          content:
            'Thank you for visiting our church online. We would love to meet you in person.',
          alignment: 'center',
        },
      },
    ];
    return WebsiteRepository.createPageData(tenantId, {
      slug: 'home',
      title: 'Welcome',
      content: JSON.stringify(sections),
      isPublished: true,
    });
  }

  static async updatePageData(tenantId: string, slug: string, data: Prisma.PageDataUpdateInput) {
    return WebsiteRepository.updatePageData(tenantId, slug, data);
  }

  static async publishPage(tenantId: string, slug: string, isPublished: boolean) {
    return WebsiteRepository.updatePageData(tenantId, slug, { isPublished });
  }

  static async wipeAllPages(tenantId: string) {
    await WebsiteRepository.wipePages(tenantId);
  }

  static async deletePage(tenantId: string, slug: string) {
    await prisma.pageData.delete({
      where: { tenantId_slug: { tenantId, slug: slug.toLowerCase().trim() } },
    });
  }

  /**
   * Replace all pages with template. Uses merged organization settings for safe defaults (no undefined access).
   */
  static async applyTemplate(tenantId: string, templateId: string) {
    const template = WEBSITE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) throw new CodedError('NOT_FOUND', 'Template not found');

    const org = await getMergedOrganizationSettings(tenantId);
    const churchName =
      typeof org?.name === 'string' && org.name.trim().length > 0 ? org.name.trim() : 'Our Church';
    const address = typeof org?.address === 'string' ? org.address : '';
    const email = typeof org?.email === 'string' ? org.email : '';
    const phone = typeof org?.phone === 'string' ? org.phone : '';

    const created = await prisma.$transaction(async (tx) => {
      await tx.pageData.deleteMany({ where: { tenantId } });
      const createdPages = [];
      for (const page of template.pages) {
        const processedSections = page.sections.map((s) => {
          const config: Record<string, unknown> =
            s.config != null && typeof s.config === 'object' && !Array.isArray(s.config)
              ? { ...(s.config as Record<string, unknown>) }
              : {};

          if (s.type === 'hero') {
            if (config.title == null || String(config.title).trim() === '') {
              config.title = `Welcome to ${churchName}`;
            }
            if (config.subtitle == null || String(config.subtitle).trim() === '') {
              config.subtitle = 'Join us this Sunday—we would love to meet you.';
            }
          }
          if (s.type === 'text') {
            if (config.content == null || String(config.content).trim() === '') {
              config.content = 'We are glad you are here.';
            }
          }
          if (s.type === 'giving_cta') {
            if (config.title == null || String(config.title).trim() === '') {
              config.title = 'Give';
            }
            if (config.description == null || String(config.description).trim() === '') {
              config.description = 'Your generosity fuels ministry and outreach in our community.';
            }
            if (config.buttonText == null || String(config.buttonText).trim() === '') {
              config.buttonText = 'Give now';
            }
          }
          if (s.type === 'contact_form') {
            config.address = address;
            config.email = email;
            config.phone = phone;
            if (config.title == null || String(config.title).trim() === '') {
              config.title = 'Contact us';
            }
          }
          if (s.type === 'event_list' || s.type === 'sermon_list') {
            if (config.title == null || String(config.title).trim() === '') {
              config.title = s.type === 'event_list' ? 'Upcoming events' : 'Latest messages';
            }
          }

          return {
            ...s,
            id: randomUUID(),
            config,
          };
        });
        const normalizedSections = normalizeWebsiteSections(processedSections);

        const slug = String(page.slug || '').trim().toLowerCase();
        if (!slug) {
          throw new CodedError('BAD_TEMPLATE', 'Template page missing slug');
        }

        const p = await tx.pageData.create({
          data: {
            tenantId,
            slug,
            title: page.title?.trim() ? page.title : slug,
            content: JSON.stringify(normalizedSections),
            isPublished: true,
          },
        });
        createdPages.push(p);
      }

      if (createdPages.length !== template.pages.length) {
        throw new CodedError('TEMPLATE_INCOMPLETE', 'Not all template pages were created');
      }

      return createdPages;
    });
    await this.ensureWebsiteOperationalSeedData(tenantId);
    return created;
  }

  static async getPublicSettings(tenantId: string) {
    const org = await getMergedOrganizationSettings(tenantId);
    const fin = await getMergedFinancialSettings(tenantId);
    const branding = (await prisma.setting.findFirst({ where: { tenantId, key: 'branding' } }))?.value;
    const parsedBranding = typeof branding === 'string' ? JSON.parse(branding) : branding;

    const seo = await this.getWebsiteSeo(tenantId);

    return {
      organization: {
        name: org.name,
        tagline: org.tagline,
        address: org.address,
        email: org.email,
        phone: org.phone,
        serviceTimes: (org as any)?.serviceTimes ?? null,
        livestreamUrl: (org as any)?.livestreamUrl ?? null,
      },
      branding: parsedBranding || { primaryColor: '#4F46E5', logo: null },
      currency: fin.currency,
      seo,
    };
  }

  static async getWebsiteSeo(tenantId: string) {
    const row = await SettingsRepository.getSettingByKey(tenantId, 'website_seo');
    if (!row?.value) {
      const org = await getMergedOrganizationSettings(tenantId);
      return {
        siteTitle: `${org.name} | Chennai`,
        description: org.tagline || '',
        keywords: 'church, worship, Chennai, Grace Community',
        allowIndexing: true,
        ogImageUrl: '',
      };
    }
    try {
      return JSON.parse(row.value) as Record<string, unknown>;
    } catch {
      return { siteTitle: '', description: '', keywords: '', allowIndexing: true, ogImageUrl: '' };
    }
  }

  static async saveWebsiteSeo(tenantId: string, data: Record<string, unknown>) {
    const payload = {
      siteTitle: String(data.siteTitle ?? '').trim(),
      description: String(data.description ?? '').trim(),
      keywords: String(data.keywords ?? '').trim(),
      allowIndexing: data.allowIndexing !== false,
      ogImageUrl: String(data.ogImageUrl ?? '').trim(),
    };
    await SettingsRepository.upsertSetting(tenantId, 'website_seo', JSON.stringify(payload));
    return payload;
  }

  static async getWebsiteMedia(tenantId: string) {
    const row = await SettingsRepository.getSettingByKey(tenantId, 'website_media');
    if (!row?.value) return [] as Array<{ id: string; url: string; filename?: string; uploadedAt: string }>;
    try {
      const parsed = JSON.parse(row.value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static async saveWebsiteMedia(
    tenantId: string,
    items: Array<{ id: string; url: string; filename?: string; uploadedAt: string }>,
  ) {
    await SettingsRepository.upsertSetting(tenantId, 'website_media', JSON.stringify(items));
    return items;
  }

  static async addWebsiteMediaItem(
    tenantId: string,
    item: { url: string; filename?: string },
  ) {
    const existing = await this.getWebsiteMedia(tenantId);
    const entry = {
      id: randomUUID(),
      url: item.url,
      filename: item.filename,
      uploadedAt: new Date().toISOString(),
    };
    const next = [entry, ...existing.filter((e) => e.url !== item.url)];
    await this.saveWebsiteMedia(tenantId, next);
    return entry;
  }

  static async removeWebsiteMediaItem(tenantId: string, id: string) {
    const existing = await this.getWebsiteMedia(tenantId);
    const next = existing.filter((e) => e.id !== id);
    await this.saveWebsiteMedia(tenantId, next);
    return next;
  }

  static async restoreFlagshipWebsite(tenantId: string) {
    const pages = await this.applyTemplate(tenantId, 'flagship-v2');
    await this.ensureWebsiteOperationalSeedData(tenantId);
    return pages;
  }
}
