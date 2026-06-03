import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { MemberDocumentRepository, SpiritualMilestoneRepository, MemberResponsibilityRepository } from '../repositories/MemberProfileRepository.js';
import { cacheInvalidatePrefix } from '../utils/opsCache.js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/prisma.js';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/** Ensure local uploads directory exists */
function ensureUploadsDir(subdir: string) {
  const dir = path.join(UPLOADS_DIR, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Store file to local disk */
async function storeFile(
  file: Express.Multer.File,
  objectName: string
): Promise<string> {
  const dir = ensureUploadsDir(path.dirname(objectName));
  const filename = path.basename(objectName);
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, file.buffer);
  
  // Return the path starting with /uploads so express.static handles it
  return `/uploads/${objectName}`;
}

async function storeTextFile(content: string, objectName: string): Promise<string> {
  const dir = ensureUploadsDir(path.dirname(objectName));
  const filename = path.basename(objectName);
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  return `/uploads/${objectName}`;
}

// ------------------------------------------------------------------
// Profile image upload helper
// ------------------------------------------------------------------
export class MemberProfileController {

  /** GET /uploads/* — serve locally stored files */
  static serveLocalFile(req: TenantRequest, res: Response) {
    try {
      const reqPath = String(req.params.filepath || req.params[0] || req.params.path || '');
      const filePath = path.join(UPLOADS_DIR, reqPath);
      // Prevent directory traversal
      if (!path.resolve(filePath).startsWith(path.resolve(UPLOADS_DIR))) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(path.resolve(filePath));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /members/:id/profile-image
   * Body: multipart/form-data, field "file"
   * Returns: { profileImageUrl }
   */
  static async uploadProfileImage(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are allowed' });
      }
      // Limit to 5MB
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size must be under 5MB' });
      }

      const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
      const objectName = `members/${req.tenantId}/${String(id)}/profile-${randomUUID()}.${ext}`;
      const url = await storeFile(file, objectName);

      // Update the member record
      const member = await prisma.member.update({
        where: { id: String(id) },
        data: { profileImageUrl: url },
      });

      res.json({ status: 'success', data: { profileImageUrl: member.profileImageUrl } });
    } catch (err: any) {
      console.error('uploadProfileImage error:', err);
      fs.writeFileSync('upload_error.log', err.stack || err.toString());
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /families/:id/image
   * Body: multipart/form-data, field "file"
   * Returns: { imageUrl }
   */
  static async uploadFamilyImage(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are allowed' });
      }
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size must be under 5MB' });
      }

      const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
      const objectName = `families/${req.tenantId}/${String(id)}/family-${randomUUID()}.${ext}`;
      const url = await storeFile(file, objectName);

      const family = await prisma.family.update({
        where: { id: String(id) },
        data: { imageUrl: url },
      });

      res.json({ status: 'success', data: { imageUrl: family.imageUrl } });
    } catch (err: any) {
      console.error('uploadFamilyImage error:', err);
      fs.writeFileSync('upload_error.log', err.stack || err.toString());
      res.status(500).json({ error: err.message });
    }
  }


  // ------------------------------------------------------------------
  // MemberDocument endpoints
  // ------------------------------------------------------------------

  /** GET /members/:id/documents */
  static async getDocuments(req: TenantRequest, res: Response) {
    try {
      const docs = await MemberDocumentRepository.findByMember(String(req.params.id));
      const masked = docs.map(d => {
        const raw = d.number;
        const n = raw != null && String(raw).trim() !== '' ? String(raw) : null;
        return {
          ...d,
          number: n ? `****${n.slice(-4)}` : null,
        };
      });
      res.json({ status: 'success', data: masked });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** POST /members/:id/documents */
  static async createDocument(req: TenantRequest, res: Response) {
    try {
      const { type, number, notes } = req.body;
      if (!type) return res.status(400).json({ error: 'type is required' });

      let fileUrl: string | null = null;
      const file = (req as any).file as Express.Multer.File | undefined;
      if (file) {
        const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'pdf';
        const objectName = `members/${req.tenantId}/${String(req.params.id)}/docs/${type}-${randomUUID()}.${ext}`;
        fileUrl = await storeFile(file, objectName);
      }

      const doc = await MemberDocumentRepository.create(req.tenantId!, String(req.params.id), {
        type,
        number: number ?? null,
        fileUrl,
        notes: notes ?? null,
        ...(req.body.acceptedAt
          ? { acceptedAt: new Date(String(req.body.acceptedAt)) }
          : {}),
        ...(req.body.signerName ? { signerName: String(req.body.signerName) } : {}),
        ...(req.body.signatureDataUrl ? { signatureDataUrl: String(req.body.signatureDataUrl) } : {}),
      });
      res.status(201).json({ status: 'success', data: { ...doc, number: doc.number ? `****${doc.number.slice(-4)}` : null } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** PATCH /members/:id/documents/:docId */
  static async updateDocument(req: TenantRequest, res: Response) {
    try {
      const { type, number, verified, notes, acceptedAt, signerName, signatureDataUrl } = req.body;
      const doc = await MemberDocumentRepository.update(String(req.params.docId), String(req.params.id), {
        type,
        number,
        verified,
        notes,
        acceptedAt: acceptedAt !== undefined ? (acceptedAt ? new Date(String(acceptedAt)) : null) : undefined,
        signerName,
        signatureDataUrl,
      });
      res.json({ status: 'success', data: { ...doc, number: doc.number ? `****${doc.number.slice(-4)}` : null } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** DELETE /members/:id/documents/:docId */
  static async deleteDocument(req: TenantRequest, res: Response) {
    try {
      await MemberDocumentRepository.delete(String(req.params.docId), String(req.params.id));
      res.json({ status: 'success' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** POST /members/:id/generated-documents — printable HTML stored under uploads, linked as MemberDocument */
  static async generateIdentityDocument(req: TenantRequest, res: Response) {
    try {
      const memberId = String(req.params.id);
      const template = String((req.body as { template?: string })?.template || '');
      const allowed = new Set(['visitor_declaration', 'member_declaration', 'baptism_certificate']);
      if (!allowed.has(template)) {
        return res.status(400).json({ error: 'Invalid template' });
      }
      const member = await prisma.member.findFirst({ where: { id: memberId, tenantId: req.tenantId! } });
      if (!member) return res.status(404).json({ error: 'Member not found' });
      const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId! } });

      const org = tenant?.name || 'Local Church';
      const title =
        template === 'visitor_declaration'
          ? 'Visitor Declaration'
          : template === 'member_declaration'
            ? 'Member Declaration'
            : 'Baptism Certificate (draft)';

      const bodyParts: string[] = [];
      bodyParts.push(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:720px;margin:auto">`,
      );
      bodyParts.push(`<h1>${title}</h1>`);
      bodyParts.push(`<p><strong>Organization:</strong> ${org}</p>`);
      bodyParts.push(`<p><strong>Member:</strong> ${member.name}</p>`);
      if (member.email) bodyParts.push(`<p><strong>Email:</strong> ${member.email}</p>`);
      if (member.phone) bodyParts.push(`<p><strong>Phone:</strong> ${member.phone}</p>`);
      if (member.growthStage) bodyParts.push(`<p><strong>Growth stage:</strong> ${member.growthStage}</p>`);
      bodyParts.push(`<p><strong>Generated (UTC):</strong> ${new Date().toISOString()}</p>`);
      bodyParts.push('<hr />');
      if (template === 'visitor_declaration') {
        bodyParts.push(
          '<p>Visitor acknowledgement for ministry administration. Replace this block with counsel-approved wording and capture formal acceptance using the document acceptance fields on file.</p>',
        );
      } else if (template === 'member_declaration') {
        bodyParts.push(
          '<p>Membership / declaration draft for Indian church administration. Finalize text with leadership, then record acceptance and optional signature metadata on the linked document record.</p>',
        );
      } else {
        bodyParts.push(
          '<p>Baptism certificate draft. Add officiant, venue, baptism date, and witness details in your records workflow; this file is a printable starting point.</p>',
        );
      }
      bodyParts.push('</body></html>');
      const html = bodyParts.join('\n');

      const safeSlug = template.replace(/_/g, '-');
      const objectName = `members/${req.tenantId}/${memberId}/generated/${safeSlug}-${randomUUID()}.html`;
      const fileUrl = await storeTextFile(html, objectName);

      const type =
        template === 'visitor_declaration'
          ? 'GeneratedVisitorDeclaration'
          : template === 'member_declaration'
            ? 'GeneratedMemberDeclaration'
            : 'GeneratedBaptismCertificate';

      const doc = await MemberDocumentRepository.create(req.tenantId!, memberId, {
        type,
        number: null,
        fileUrl,
        notes: `Auto-generated from template: ${template}`,
      });
      res.status(201).json({
        status: 'success',
        data: { ...doc, number: doc.number ? `****${String(doc.number).slice(-4)}` : null },
      });
    } catch (err: any) {
      console.error('generateIdentityDocument error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // ------------------------------------------------------------------
  // SpiritualMilestone endpoints
  // ------------------------------------------------------------------

  /** GET /members/:id/milestones */
  static async getMilestones(req: TenantRequest, res: Response) {
    try {
      const milestones = await SpiritualMilestoneRepository.findByMember(String(req.params.id));
      res.json({ status: 'success', data: milestones });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** POST /members/:id/milestones */
  static async createMilestone(req: TenantRequest, res: Response) {
    try {
      const { type, date, notes } = req.body;
      if (!type || !date) return res.status(400).json({ error: 'type and date are required' });
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return res.status(400).json({ error: 'Invalid date' });

      const milestone = await SpiritualMilestoneRepository.create(req.tenantId!, String(req.params.id), {
        type, date: parsedDate, notes: notes ?? null,
      });
      res.status(201).json({ status: 'success', data: milestone });
    } catch (err: any) {
      console.error("createMilestone error:", err);
      res.status(500).json({ error: err.message });
    }
  }

  /** PATCH /members/:id/milestones/:milestoneId */
  static async updateMilestone(req: TenantRequest, res: Response) {
    try {
      const { type, date, notes } = req.body;
      const parsedDate = date ? new Date(date) : undefined;
      const milestone = await SpiritualMilestoneRepository.update(String(req.params.milestoneId), String(req.params.id), {
        type, date: parsedDate, notes,
      });
      res.json({ status: 'success', data: milestone });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** DELETE /members/:id/milestones/:milestoneId */
  static async deleteMilestone(req: TenantRequest, res: Response) {
    try {
      await SpiritualMilestoneRepository.delete(String(req.params.milestoneId), String(req.params.id));
      res.json({ status: 'success' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // ------------------------------------------------------------------
  // MemberResponsibility endpoints
  // ------------------------------------------------------------------

  /** GET /members/:id/responsibilities */
  static async getResponsibilities(req: TenantRequest, res: Response) {
    try {
      const items = await MemberResponsibilityRepository.findByMember(String(req.params.id));
      res.json({ status: 'success', data: items });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** POST /members/:id/responsibilities */
  static async createResponsibility(req: TenantRequest, res: Response) {
    try {
      const { role, entityType, entityId, status, allocatedFunds, usedFunds, notes } = req.body;
      if (!role) return res.status(400).json({ error: 'role is required' });

      const item = await MemberResponsibilityRepository.create(req.tenantId!, String(req.params.id), {
        role,
        entityType: entityType || 'Ministry',
        entityId,
        status,
        allocatedFunds,
        usedFunds,
        notes,
      });
      cacheInvalidatePrefix(`volunteer-board:${req.tenantId!}:`);
      res.status(201).json({ status: 'success', data: item });
    } catch (err: any) {
      console.error("createResponsibility error:", err);
      res.status(500).json({ error: err.message });
    }
  }

  /** PATCH /members/:id/responsibilities/:resId */
  static async updateResponsibility(req: TenantRequest, res: Response) {
    try {
      const item = await MemberResponsibilityRepository.update(String(req.params.resId), String(req.params.id), req.body);
      cacheInvalidatePrefix(`volunteer-board:${req.tenantId!}:`);
      res.json({ status: 'success', data: item });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** DELETE /members/:id/responsibilities/:resId */
  static async deleteResponsibility(req: TenantRequest, res: Response) {
    try {
      await MemberResponsibilityRepository.delete(String(req.params.resId), String(req.params.id));
      cacheInvalidatePrefix(`volunteer-board:${req.tenantId!}:`);
      res.json({ status: 'success' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // ------------------------------------------------------------------
  // Family Linking
  // ------------------------------------------------------------------

  /** POST /members/:id/family/link */
  static async linkFamily(req: TenantRequest, res: Response) {
    try {
      const { familyId, familyName } = req.body;
      const { id } = req.params;

      let targetFamilyId = familyId;

      if (!targetFamilyId && familyName) {
        // Create new family
        const family = await prisma.family.create({
          data: {
            tenantId: req.tenantId!,
            name: familyName
          }
        });
        targetFamilyId = family.id;
      }

      if (!targetFamilyId) return res.status(400).json({ error: 'familyId or familyName required' });

      const updated = await prisma.member.update({
        where: { id: String(id), tenantId: req.tenantId! },
        data: { familyId: targetFamilyId }
      });

      res.json({ status: 'success', data: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** POST /members/:id/family/unlink */
  static async unlinkFamily(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;

      const updated = await prisma.member.update({
        where: { id: String(id), tenantId: req.tenantId! },
        data: { familyId: null }
      });

      res.json({ status: 'success', data: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** GET /families */
  static async listFamilies(req: TenantRequest, res: Response) {
    try {
      const families = await prisma.family.findMany({
        where: { tenantId: req.tenantId! },
        orderBy: { name: 'asc' },
        include: { _count: { select: { members: true } } },
      });
      res.json({ status: 'success', data: families });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** POST /families */
  static async createFamily(req: TenantRequest, res: Response) {
    try {
      const { name, addressLine1, addressLine2, city, stateRegion, postalCode, country } = req.body as {
        name?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        stateRegion?: string;
        postalCode?: string;
        country?: string;
      };
      if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
      const family = await prisma.family.create({
        data: {
          tenantId: req.tenantId!,
          name: name.trim(),
          addressLine1: addressLine1?.trim() || undefined,
          addressLine2: addressLine2?.trim() || undefined,
          city: city?.trim() || undefined,
          stateRegion: stateRegion?.trim() || undefined,
          postalCode: postalCode?.trim() || undefined,
          country: country?.trim() || 'India',
        },
      });
      res.status(201).json({ status: 'success', data: family });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /** POST /members/:id/care-notes */
  static async createCareNote(req: TenantRequest, res: Response) {
    try {
      const { note } = req.body;
      if (!note) return res.status(400).json({ error: 'note is required' });
      
      const careNote = await prisma.careNote.create({
        data: {
          tenantId: req.tenantId!,
          memberId: String(req.params.id),
          authorId: req.user.id,
          note,
        }
      });
      res.status(201).json({ status: 'success', data: careNote });
    } catch (err: any) {
      console.error("createCareNote error:", err);
      res.status(500).json({ error: err.message });
    }
  }

  /** GET /members/:id/care-notes */
  static async getCareNotes(req: TenantRequest, res: Response) {
    try {
      const notes = await prisma.careNote.findMany({
        where: { 
          tenantId: req.tenantId!,
          memberId: String(req.params.id)
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ status: 'success', data: notes });
    } catch (err: any) {
      console.error("getCareNotes error:", err);
      res.status(500).json({ error: err.message });
    }
  }
}
