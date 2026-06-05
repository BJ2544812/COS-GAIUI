export type DonationLang =
  | 'en'
  | 'hi'
  | 'ta'
  | 'te'
  | 'ml'
  | 'kn'
  | 'bn'
  | 'mr'
  | 'pa';

export const DONATION_LANGS: { code: DonationLang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'mr', label: 'मराठी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

export const DONATION_CATEGORIES = [
  'Sunday Offering',
  'Tithe',
  'Missions',
  'Building Fund',
  'General Donation',
  'Event Offering',
  'Youth Camp',
  'Restricted Donation',
  'Other',
] as const;

type Dict = Record<string, string>;

const en: Dict = {
  title: 'Give with joy',
  subtitle: 'Secure online giving',
  stepType: 'Donation type',
  stepDetails: 'Your details',
  stepPay: 'Payment',
  name: 'Full name',
  phone: 'Mobile number',
  coverFee: 'Cover payment processing charges',
  coverFeeHint: 'Optional — you pay the gateway fee so the church receives the full amount.',
  amount: 'Amount (INR)',
  continue: 'Continue',
  payNow: 'Pay securely',
  success: 'Thank you! Your gift was recorded and a receipt will be issued.',
  anonymous: 'Give anonymously',
  loading: 'Preparing checkout…',
  error: 'Something went wrong. Please try again.',
};

const hi: Dict = {
  ...en,
  title: 'प्रभु के कार्य में दान करें',
  subtitle: 'सुरक्षित ऑनलाइन दान',
  stepType: 'दान का प्रकार',
  stepDetails: 'आपका विवरण',
  stepPay: 'भुगतान',
  name: 'पूरा नाम',
  phone: 'मोबाइल नंबर',
  coverFee: 'भुगतान शुल्क वहन करें',
  amount: 'राशि (INR)',
  continue: 'आगे बढ़ें',
  payNow: 'सुरक्षित भुगतान',
  success: 'धन्यवाद! आपका दान दर्ज हो गया है।',
  anonymous: 'गुमनाम दान',
};

const ta: Dict = { ...en, title: 'கொடை செய்யுங்கள்', subtitle: 'பாதுகாப்பான ஆன்லைன் கொடை' };
const te: Dict = { ...en, title: 'దానం చేయండి', subtitle: 'సురక్షిత ఆన్‌లైన్ దానం' };
const ml: Dict = { ...en, title: 'ദാനം നൽകുക', subtitle: 'സുരക്ഷിത ഓൺലൈൻ ദാനം' };
const kn: Dict = { ...en, title: 'ದಾನ ಮಾಡಿ', subtitle: 'ಸುರಕ್ಷಿತ ಆನ್‌ಲೈನ್ ದಾನ' };
const bn: Dict = { ...en, title: 'দান করুন', subtitle: 'নিরাপদ অনলাইন দান' };
const mr: Dict = { ...en, title: 'दान करा', subtitle: 'सुरक्षित ऑनलाइन दान' };
const pa: Dict = { ...en, title: 'ਦਾਨ ਕਰੋ', subtitle: 'ਸੁਰੱਖਿਅਤ ਔਨਲਾਈਨ ਦਾਨ' };

const MAP: Record<DonationLang, Dict> = { en, hi, ta, te, ml, kn, bn, mr, pa };

export function t(lang: DonationLang, key: keyof typeof en): string {
  return MAP[lang]?.[key] ?? en[key] ?? key;
}
