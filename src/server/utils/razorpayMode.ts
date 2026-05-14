import { CodedError } from './apiErrors.js';

export type RazorpayMode = 'test' | 'live';

/**
 * Server-wide expected mode. Set RAZORPAY_MODE=test|live; defaults from NODE_ENV (production → live else test).
 */
export function getExpectedRazorpayMode(): RazorpayMode {
  const m = (process.env.RAZORPAY_MODE || '').toLowerCase().trim();
  if (m === 'test' || m === 'live') return m;
  return process.env.NODE_ENV === 'production' ? 'live' : 'test';
}

export function inferRazorpayKeyMode(keyId: string | undefined | null): RazorpayMode | null {
  if (!keyId) return null;
  if (keyId.startsWith('rzp_test_')) return 'test';
  if (keyId.startsWith('rzp_live_')) return 'live';
  return null;
}

/**
 * Prevents using test keys in a live-expected environment (and the inverse).
 */
export function assertRazorpayKeyMatchesMode(keyId: string | null | undefined): void {
  if (!keyId || !keyId.trim()) return;
  const expected = getExpectedRazorpayMode();
  const actual = inferRazorpayKeyMode(keyId);
  if (actual && actual !== expected) {
    throw new CodedError(
      'RAZORPAY_KEY_MODE_MISMATCH',
      `Razorpay key mode (${actual}) does not match server RAZORPAY_MODE / environment (expected ${expected}).`
    );
  }
}
