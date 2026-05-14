import { DocumentRepository } from '../repositories/DocumentRepository.js';
import { Prisma } from '@prisma/client';
import { getMergedDocumentSettings, getMergedOrganizationSettings } from '../utils/mergeTenantSettings.js';
import { DEFAULT_SETTINGS } from '../utils/settingsDefaults.js';

export class DocumentService {
  static async createDocument(tenantId: string, data: Omit<Prisma.DocumentCreateInput, 'tenant'>) {
    return DocumentRepository.createDocument(tenantId, data as any);
  }

  static async getDocuments(tenantId: string) {
    return DocumentRepository.getDocuments(tenantId);
  }

  static async deleteDocument(tenantId: string, id: string) {
    return DocumentRepository.deleteDocument(tenantId, id);
  }

  /** Fetch document-related data from settings (organization logo & documents.*). No ad-hoc placeholders. */
  static async getDocumentBranding(tenantId: string) {
    const [org, docs] = await Promise.all([
      getMergedOrganizationSettings(tenantId),
      getMergedDocumentSettings(tenantId),
    ]);
    return {
      logo: org.logo ?? DEFAULT_SETTINGS.organization.logo,
      orgName: org.name ?? DEFAULT_SETTINGS.organization.name,
      pastorSignature: docs.pastorSignature ?? DEFAULT_SETTINGS.documents.pastorSignature,
      accountantSignature: docs.accountantSignature ?? DEFAULT_SETTINGS.documents.accountantSignature,
      authorizedSignatoryName: docs.authorizedSignatoryName ?? DEFAULT_SETTINGS.documents.authorizedSignatoryName,
      sealStamp: docs.sealStamp ?? DEFAULT_SETTINGS.documents.sealStamp,
    };
  }
}
