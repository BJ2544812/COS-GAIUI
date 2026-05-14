import { randomUUID } from 'node:crypto';
import { WebsiteRepository } from '../repositories/WebsiteRepository.js';
import { Prisma } from '@prisma/client';
import { WEBSITE_TEMPLATES } from '../utils/websiteDefaults.js';
import { prisma } from '../utils/prisma.js';
import { getMergedOrganizationSettings, getMergedFinancialSettings } from '../utils/mergeTenantSettings.js';
import { CodedError } from '../utils/apiErrors.js';

export class WebsiteService {
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
    const pages = await WebsiteRepository.getPages(tenantId);
    if (onlyPublished) {
      return pages.filter((p) => p.isPublished);
    }
    return pages;
  }

  static async getPageBySlug(tenantId: string, slug: string) {
    return WebsiteRepository.getPageBySlug(tenantId, slug);
  }

  /** Public site: published pages only (no silent auto-create; apply a template or create pages explicitly). */
  static async getPublicPageBySlug(tenantId: string, slug: string) {
    const s = String(slug || '').trim().toLowerCase() || 'home';
    let page = await WebsiteRepository.getPageBySlug(tenantId, s);
    if (page && !page.isPublished) {
      page = null;
    }
    return page;
  }

  /** Public listing: upcoming events first, then recent past if none upcoming (tenant-scoped, no auth). */
  static async getPublicEvents(tenantId: string, limit = 20) {
    const cap = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const upcoming = await prisma.event.findMany({
      where: { tenantId, date: { gte: startOfToday } },
      orderBy: { date: 'asc' },
      take: cap,
      select: { id: true, name: true, type: true, date: true },
    });

    if (upcoming.length >= cap) {
      return upcoming.map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        date: e.date.toISOString(),
      }));
    }

    const past = await prisma.event.findMany({
      where: { tenantId, date: { lt: startOfToday } },
      orderBy: { date: 'desc' },
      take: cap - upcoming.length,
      select: { id: true, name: true, type: true, date: true },
    });
    const merged = [...upcoming, ...past.reverse()];
    return merged.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      date: e.date.toISOString(),
    }));
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

    return prisma.$transaction(async (tx) => {
      await tx.pageData.deleteMany({ where: { tenantId } });
      const created = [];
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

        const slug = String(page.slug || '').trim().toLowerCase();
        if (!slug) {
          throw new CodedError('BAD_TEMPLATE', 'Template page missing slug');
        }

        const p = await tx.pageData.create({
          data: {
            tenantId,
            slug,
            title: page.title?.trim() ? page.title : slug,
            content: JSON.stringify(processedSections),
            isPublished: true,
          },
        });
        created.push(p);
      }

      if (created.length !== template.pages.length) {
        throw new CodedError('TEMPLATE_INCOMPLETE', 'Not all template pages were created');
      }

      return created;
    });
  }

  static async getPublicSettings(tenantId: string) {
    const org = await getMergedOrganizationSettings(tenantId);
    const fin = await getMergedFinancialSettings(tenantId);
    const branding = (await prisma.setting.findFirst({ where: { tenantId, key: 'branding' } }))?.value;
    const parsedBranding = typeof branding === 'string' ? JSON.parse(branding) : branding;

    return {
      organization: {
        name: org.name,
        tagline: org.tagline,
        address: org.address,
        email: org.email,
        phone: org.phone,
      },
      branding: parsedBranding || { primaryColor: '#4F46E5', logo: null },
      currency: fin.currency,
    };
  }
}
