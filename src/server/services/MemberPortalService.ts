import { prisma } from '../utils/prisma.js';

function parseOrganizationSetting(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export class MemberPortalService {
  static async getPortalSummary(tenantId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        username: true,
        email: true,
        memberId: true,
        role: { select: { name: true } },
      },
    });

    if (!user) throw new Error('User not found');

    if (!user.memberId) {
      return {
        linked: false,
        user: { username: user.username, email: user.email, role: user.role.name },
        message: 'Your account is not linked to a member profile. Ask your church office to connect your user record.',
      };
    }

    const memberId = user.memberId;
    const since90 = new Date(Date.now() - 90 * 86400000);

    const orgSetting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'organization' } },
      select: { value: true },
    });
    const churchInfo = parseOrganizationSetting(orgSetting?.value);

    const [
      member,
      attendance,
      donations,
      responsibilities,
      upcomingEvents,
      tasks,
      notifications,
      groups,
      sermons,
      documents,
      prayerRequests,
    ] = await Promise.all([
      prisma.member.findFirst({
        where: { id: memberId, tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          growthStage: true,
          city: true,
          membershipDate: true,
        },
      }),
      prisma.attendance.findMany({
        where: { tenantId, memberId, checkInTime: { gte: since90 } },
        orderBy: { checkInTime: 'desc' },
        take: 12,
        include: { session: { select: { name: true } } },
      }),
      prisma.donation.findMany({
        where: { tenantId, donorId: memberId },
        orderBy: { date: 'desc' },
        take: 10,
        select: { id: true, amount: true, date: true, fund: { select: { name: true } } },
      }),
      prisma.memberResponsibility.findMany({
        where: { tenantId, memberId, status: 'Active' },
        take: 15,
        orderBy: { startDate: 'desc' },
      }),
      prisma.event.findMany({
        where: { tenantId, date: { gte: new Date() } },
        orderBy: { date: 'asc' },
        take: 8,
        select: { id: true, name: true, date: true, location: true, type: true },
      }),
      prisma.task.findMany({
        where: {
          tenantId,
          OR: [{ assignedMemberId: memberId }, { assignedUserId: userId }],
          status: { not: 'COMPLETED' },
        },
        orderBy: { dueDate: 'asc' },
        take: 8,
        select: { id: true, title: true, status: true, dueDate: true, priority: true },
      }),
      prisma.notification.findMany({
        where: { tenantId, userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, message: true, status: true, createdAt: true },
      }),
      prisma.smallGroupMember.findMany({
        where: { tenantId, memberId },
        include: { group: { select: { id: true, name: true, meetingDay: true, type: true } } },
        take: 10,
      }),
      prisma.sermon.findMany({
        where: { tenantId, isPublished: true },
        orderBy: { date: 'desc' },
        take: 6,
        select: { id: true, title: true, speaker: true, date: true, videoUrl: true },
      }),
      prisma.memberDocument.findMany({
        where: { tenantId, memberId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, type: true, verified: true, createdAt: true },
      }),
      prisma.prayerRequest.findMany({
        where: { tenantId, requesterId: memberId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, content: true, status: true, createdAt: true },
      }),
    ]);

    const attendanceTotal = await prisma.attendance.count({
      where: { tenantId, memberId, checkInTime: { gte: since90 } },
    });

    const givingTotal = donations.reduce((sum, d) => sum + Number(d.amount), 0);

    return {
      linked: true,
      member,
      user: { username: user.username, email: user.email, role: user.role.name },
      churchInfo: churchInfo
        ? {
            name: String(churchInfo.name ?? 'Your church'),
            tagline: churchInfo.tagline ? String(churchInfo.tagline) : undefined,
            address: churchInfo.address ? String(churchInfo.address) : undefined,
            phone: churchInfo.phone ? String(churchInfo.phone) : undefined,
            email: churchInfo.email ? String(churchInfo.email) : undefined,
          }
        : null,
      attendance: {
        recent: attendance.map((a) => ({
          id: a.id,
          at: a.checkInTime.toISOString(),
          session: a.session?.name ?? 'Gathering',
          method: a.method,
        })),
        count90Days: attendanceTotal,
      },
      giving: {
        recent: donations.map((d) => ({
          id: d.id,
          amount: Number(d.amount),
          date: d.date.toISOString(),
          fund: d.fund?.name ?? 'General',
        })),
        totalRecent: givingTotal,
      },
      volunteer: responsibilities.map((r) => ({
        id: r.id,
        role: r.role,
        entityType: r.entityType,
        startDate: r.startDate.toISOString(),
      })),
      upcomingEvents: upcomingEvents.map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date.toISOString(),
        location: e.location,
        type: e.type,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        dueDate: t.dueDate?.toISOString() ?? null,
        priority: t.priority,
      })),
      notifications,
      smallGroups: groups.map((g) => ({
        id: g.group.id,
        name: g.group.name,
        role: g.role,
        meetingDay: g.group.meetingDay,
        type: g.group.type,
        joinedAt: g.joinedAt.toISOString(),
      })),
      sermons: sermons.map((s) => ({
        id: s.id,
        title: s.title,
        speaker: s.speaker,
        date: s.date.toISOString(),
        watchUrl: s.videoUrl ? `/sermons/watch/${s.id}` : null,
      })),
      documents: documents.map((d) => ({
        id: d.id,
        type: d.type,
        verified: d.verified,
        uploadedAt: d.createdAt.toISOString(),
      })),
      prayerRequests: prayerRequests.map((p) => ({
        id: p.id,
        content: p.content,
        status: p.status,
        submittedAt: p.createdAt.toISOString(),
      })),
    };
  }

  static async submitPrayerRequest(tenantId: string, userId: string, content: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { memberId: true },
    });
    if (!user?.memberId) {
      throw new Error('Link your account to a member profile before submitting prayer requests.');
    }
    const text = content.trim();
    if (!text) throw new Error('Please enter your prayer request.');

    return prisma.prayerRequest.create({
      data: {
        tenantId,
        requesterId: user.memberId,
        content: text,
        visibility: 'PASTORAL',
        status: 'Active',
        category: 'general',
      },
      select: { id: true, status: true, createdAt: true },
    });
  }
}
