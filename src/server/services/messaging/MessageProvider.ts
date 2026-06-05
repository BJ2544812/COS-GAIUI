/**
 * Multi-channel messaging abstraction. In-app uses NotificationService;
 * external channels log delivery intent until SMTP/SMS/WhatsApp providers are configured.
 */
export type MessageChannel = 'in_app' | 'email' | 'sms' | 'whatsapp';

export type OutboundMessage = {
  tenantId: string;
  channel: MessageChannel;
  recipientKey: string;
  memberId?: string;
  userId?: string;
  subject: string;
  body: string;
  campaignId?: string;
};

export type DeliveryResult = {
  status: 'delivered' | 'logged' | 'failed';
  detail?: string;
};

export interface MessageProviderAdapter {
  readonly channel: MessageChannel;
  send(message: OutboundMessage): Promise<DeliveryResult>;
}

export class InAppMessageProvider implements MessageProviderAdapter {
  readonly channel = 'in_app' as const;

  async send(message: OutboundMessage): Promise<DeliveryResult> {
    if (!message.userId) {
      return { status: 'logged', detail: 'No linked user for in-app delivery' };
    }
    const { NotificationService } = await import('../NotificationService.js');
    await NotificationService.createNotification({
      tenantId: message.tenantId,
      userId: message.userId,
      type: 'CampaignMessage',
      title: message.subject,
      message: message.body,
      priority: 'MEDIUM',
      actionType: 'VIEW_MODULE',
      actionLink: 'communication',
      expiresInDays: 30,
    });
    return { status: 'delivered' };
  }
}

export class ExternalLogMessageProvider implements MessageProviderAdapter {
  constructor(public readonly channel: 'email' | 'sms' | 'whatsapp') {}

  async send(message: OutboundMessage): Promise<DeliveryResult> {
    const { CommunicationRepository } = await import('../../repositories/CommunicationRepository.js');
    await CommunicationRepository.logCommunication(message.tenantId, {
      type: this.channel.toUpperCase(),
      recipient: message.recipientKey,
      subject: message.subject,
      content: message.body,
      status: `${this.channel}_queued`,
    } as never);
    const envKey =
      this.channel === 'email'
        ? 'SMTP_HOST'
        : this.channel === 'sms'
          ? 'SMS_PROVIDER_URL'
          : 'WHATSAPP_PROVIDER_URL';
    const configured = Boolean(process.env[envKey]?.trim());
    return {
      status: configured ? 'logged' : 'logged',
      detail: configured
        ? `${this.channel} provider configured — delivery queued for transport worker`
        : `${this.channel} provider not configured — logged only`,
    };
  }
}

export function getMessageProviders(): MessageProviderAdapter[] {
  return [
    new InAppMessageProvider(),
    new ExternalLogMessageProvider('email'),
    new ExternalLogMessageProvider('sms'),
    new ExternalLogMessageProvider('whatsapp'),
  ];
}
