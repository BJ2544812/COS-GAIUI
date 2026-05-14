import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class GivingRepository {
  static async createCampaign(tenantId: string, data: Prisma.CampaignCreateInput) {
    return prisma.campaign.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  static async getCampaigns(tenantId: string) {
    return prisma.campaign.findMany({ where: { tenantId } });
  }

  static async createDonation(tenantId: string, data: any) {
    const { donorId, campaignId, memberId, allocation, ...rest } = data;
    
    const cleanData: any = {
      amount: rest.amount,
      method: rest.method,
      date: rest.date,
      reference: rest.reference,
      source: rest.source,
      sourceRefId: rest.sourceRefId,
      notes: rest.notes,
      metadata: rest.metadata,
      tenant: { connect: { id: tenantId } },
    };

    const finalDonorId = (donorId === 'anonymous' || memberId === 'anonymous') ? null : (donorId || memberId);
    const finalCampaignId = (campaignId === 'general' || allocation === 'general') ? null : (campaignId || allocation);

    if (finalDonorId && finalDonorId !== 'null') cleanData.donor = { connect: { id: finalDonorId } };
    if (finalCampaignId && finalCampaignId !== 'null') cleanData.campaign = { connect: { id: finalCampaignId } };

    return prisma.donation.create({
      data: cleanData,
    });
  }

  static async createDonationTx(
    tx: Prisma.TransactionClient,
    tenantId: string,
    data: any
  ) {
    const { donorId, campaignId, memberId, allocation, ...rest } = data;
    
    const cleanData: any = {
      amount: rest.amount,
      method: rest.method,
      date: rest.date,
      reference: rest.reference,
      source: rest.source,
      sourceRefId: rest.sourceRefId,
      notes: rest.notes,
      metadata: rest.metadata,
      tenant: { connect: { id: tenantId } },
    };

    const finalDonorId = (donorId === 'anonymous' || memberId === 'anonymous') ? null : (donorId || memberId);
    const finalCampaignId = (campaignId === 'general' || allocation === 'general') ? null : (campaignId || allocation);

    if (finalDonorId && finalDonorId !== 'null') cleanData.donor = { connect: { id: finalDonorId } };
    if (finalCampaignId && finalCampaignId !== 'null') cleanData.campaign = { connect: { id: finalCampaignId } };

    return tx.donation.create({
      data: cleanData,
    });
  }

  static async getDonations(tenantId: string) {
    return prisma.donation.findMany({
      where: { tenantId },
      include: { donor: true, campaign: true },
      orderBy: { date: 'desc' },
    });
  }

  static async findByReference(tenantId: string, reference: string) {
    return prisma.donation.findFirst({
      where: { tenantId, reference: { equals: reference, mode: 'insensitive' } },
      include: { donor: true, campaign: true },
    });
  }
}
