import { z } from 'zod';

// --- Individual Section Schemas ---

export const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  tagline: z.string().max(200).optional().default(''),
  logo: z.string().optional().default(''),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional().default(''),
  registrationNumber: z.string().optional().default(''),
  taxId: z.string().optional().default(''),
});

export const brandingSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex (e.g. #4F46E5)')
    .default('#4F46E5'),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Secondary color must be a valid hex')
    .default('#10B981'),
  themeMode: z.enum(['light', 'dark', 'system']).default('light'),
  emailHeaderLogo: z.string().optional().default(''),
  emailFooterText: z.string().max(500).optional().default(''),
  publicTagline: z.string().max(200).optional().default(''),
  favicon: z.string().optional().default(''),
});

const VALID_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const financialSchema = z.object({
  currency: z.enum(['INR', 'USD'], { message: 'Currency must be INR or USD' }),
  financialYearStart: z
    .enum(VALID_MONTHS, { message: 'Financial year start must be a valid month name' })
    .default('April'),
  defaultAccounts: z
    .object({
      cash: z.string().optional().default(''),
      bank: z.string().optional().default(''),
      gatewayClearing: z.string().optional().default(''),
      gatewayRecoveryIncome: z.string().optional().default(''),
      gatewayChargesExpense: z.string().optional().default(''),
      tithes: z.string().optional().default(''),
      offerings: z.string().optional().default(''),
    })
    .optional()
    .default({
      cash: '',
      bank: '',
      gatewayClearing: '',
      gatewayRecoveryIncome: '',
      gatewayChargesExpense: '',
      tithes: '',
      offerings: '',
    }),
  gatewayFeePercent: z.number().min(0).max(10).optional().default(1.8),
  gatewayFeeGstPercent: z.number().min(0).max(28).optional().default(18),
  voucherPrefix: z.string().max(10, 'Voucher prefix must be 10 characters or fewer').optional().default('VCH-'),
  numberingFormat: z.string().optional().default('00000'),
  /** Empty = no lock. YYYY-MM-DD: posting is blocked for voucher dates on or before this day (inclusive). */
  lockedUntilDate: z
    .string()
    .optional()
    .default('')
    .refine(
      (s) => s === '' || /^\d{4}-\d{2}-\d{2}$/.test(s),
      { message: 'lockedUntilDate must be empty or YYYY-MM-DD' }
    ),
});

export const paymentGatewaySchema = z.object({
  onlineGivingEnabled: z.boolean().optional().default(true),
  primaryGateway: z.enum(['cashfree', 'razorpay']).optional().default('cashfree'),
  cashfreeEnvironment: z.enum(['sandbox', 'production']).optional().default('sandbox'),
  cashfreeAppId: z.string().optional().default(''),
  cashfreeSecretKey: z.string().optional().default(''),
  cashfreeWebhookSecret: z.string().optional().default(''),
  thankYouMessage: z.string().max(2000).optional().default(''),
  donorConfirmationEmail: z.boolean().optional().default(true),
  recurringGivingEnabled: z.boolean().optional().default(false),
  razorpayKeyId: z.string().optional().default(''),
  razorpayKeySecret: z.string().optional().default(''),
  razorpayWebhookSecret: z.string().optional().default(''),
}).superRefine((data, ctx) => {
  const hasCashfreeAny = !!(data.cashfreeAppId || data.cashfreeSecretKey || data.cashfreeWebhookSecret);
  if (hasCashfreeAny) {
    if (!data.cashfreeAppId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cashfree App ID is required when configuring payment gateway', path: ['cashfreeAppId'] });
    }
    if (!data.cashfreeSecretKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cashfree Secret Key is required when configuring payment gateway', path: ['cashfreeSecretKey'] });
    }
    if (!data.cashfreeWebhookSecret) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cashfree Webhook Secret is required when configuring payment gateway', path: ['cashfreeWebhookSecret'] });
    }
  }
  const hasAny = !!(data.razorpayKeyId || data.razorpayKeySecret || data.razorpayWebhookSecret);
  if (hasAny) {
    if (!data.razorpayKeyId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Razorpay Key ID is required when configuring payment gateway', path: ['razorpayKeyId'] });
    }
    if (!data.razorpayKeySecret) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Razorpay Key Secret is required when configuring payment gateway', path: ['razorpayKeySecret'] });
    }
    if (!data.razorpayWebhookSecret) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Razorpay Webhook Secret is required when configuring payment gateway', path: ['razorpayWebhookSecret'] });
    }
  }
});

export const documentsSchema = z.object({
  pastorSignature: z.string().optional().default(''),
  accountantSignature: z.string().optional().default(''),
  authorizedSignatoryName: z.string().optional().default(''),
  sealStamp: z.string().optional().default(''),
});

export const systemSchema = z.object({
  timezone: z.string().min(1).default('Asia/Kolkata'),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY'),
  language: z.enum(['en', 'hi', 'ta']).default('en'),
  auditLogging: z.boolean().optional().default(true),
  dataRetentionDays: z.number().int().min(30).max(3650).optional().default(365),
});

export const operationalSchema = z.object({
  notificationDelivery: z.enum(['in_app', 'email', 'both']).default('in_app'),
  defaultConfidentiality: z
    .enum(['PUBLIC', 'GROUP', 'PASTORAL', 'SENIOR_PASTORAL', 'RESTRICTED'])
    .default('PUBLIC'),
  autoAssignCareCases: z.boolean().optional().default(false),
  requireFollowUpApproval: z.boolean().optional().default(true),
});

export const SETTINGS_SECTION_KEYS = [
  'organization',
  'branding',
  'financial',
  'paymentGateway',
  'documents',
  'system',
  'operational',
] as const;

// --- Full Settings Payload Schema ---
export const settingsPayloadSchema = z.object({
  organization:   organizationSchema.optional(),
  branding:       brandingSchema.optional(),
  financial:      financialSchema.optional(),
  paymentGateway: paymentGatewaySchema.optional(),
  documents:      documentsSchema.optional(),
  system:         systemSchema.optional(),
  operational:    operationalSchema.optional(),
});

export type SettingsPayload = z.infer<typeof settingsPayloadSchema>;
