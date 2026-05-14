/**
 * Formats an amount using tenant currency (e.g. from settings.financial.currency).
 */
export function formatCurrencyAmount(
  amount: number,
  currency: string = 'INR',
  options?: { maximumFractionDigits?: number; locale?: string }
) {
  const locale = options?.locale ?? 'en-IN';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(amount);
}
