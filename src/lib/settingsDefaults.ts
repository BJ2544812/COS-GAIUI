/**
 * Canonical default settings (system defaults). Used when the DB has no value.
 * Server and client both import from this module — single source of truth.
 */
export const DEFAULT_SETTINGS = {
  organization: {
    name: 'Organization',
    tagline: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    registrationNumber: '',
    taxId: '',
  },
  branding: {
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    themeMode: 'light' as 'light' | 'dark' | 'system',
    emailHeaderLogo: '',
    emailFooterText: '',
    publicTagline: '',
    favicon: '',
  },
  financial: {
    currency: 'INR',
    financialYearStart: 'April',
    defaultAccounts: {
      cash: '',
      bank: '',
      gatewayClearing: '',
      gatewayRecoveryIncome: '',
      gatewayChargesExpense: '',
      tithes: '',
      offerings: '',
    },
    /** Estimated gateway fee % for donor "cover charges" calculator (excl. GST). */
    gatewayFeePercent: 1.8,
    gatewayFeeGstPercent: 18,
    voucherPrefix: 'VCH-',
    numberingFormat: '00000',
    /** ISO date (YYYY-MM-DD). Posting is blocked for voucher dates on or before this day (inclusive). Empty = no lock. */
    lockedUntilDate: '',
  },
  paymentGateway: {
    onlineGivingEnabled: true,
    primaryGateway: 'cashfree' as 'cashfree' | 'razorpay',
    cashfreeEnvironment: 'sandbox' as 'sandbox' | 'production',
    cashfreeAppId: '',
    cashfreeSecretKey: '',
    cashfreeWebhookSecret: '',
    thankYouMessage: 'Thank you for your generous gift. Your support helps us serve our community.',
    donorConfirmationEmail: true,
    recurringGivingEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    razorpayWebhookSecret: '',
  },
  documents: {
    pastorSignature: '',
    accountantSignature: '',
    authorizedSignatoryName: '',
    sealStamp: '',
  },
  system: {
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY' as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD',
    language: 'en' as 'en' | 'hi' | 'ta',
    auditLogging: true,
    dataRetentionDays: 365,
  },
  operational: {
    notificationDelivery: 'in_app' as 'in_app' | 'email' | 'both',
    defaultConfidentiality: 'PUBLIC' as 'PUBLIC' | 'GROUP' | 'PASTORAL' | 'SENIOR_PASTORAL' | 'RESTRICTED',
    autoAssignCareCases: false,
    requireFollowUpApproval: true,
  }
};

export type DefaultSettings = typeof DEFAULT_SETTINGS;
