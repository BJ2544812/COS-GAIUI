/** Round to 2 decimal places (INR). */
export function roundInr(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Estimate gateway processing fee on donation amount (fee exclusive of donation).
 * fee = donation * (rate/100) * (1 + gst/100) when donor covers charges.
 */
export function estimateGatewayFee(
  donationAmount: number,
  opts?: { feePercent?: number; gstPercent?: number }
): number {
  const rate = opts?.feePercent ?? 1.8;
  const gst = opts?.gstPercent ?? 18;
  const base = donationAmount * (rate / 100);
  return roundInr(base * (1 + gst / 100));
}

export function computeCheckoutAmounts(
  donationAmount: number,
  donorCoveredFee: boolean,
  opts?: { feePercent?: number; gstPercent?: number }
) {
  const fee = estimateGatewayFee(donationAmount, opts);
  const gross = donorCoveredFee ? roundInr(donationAmount + fee) : donationAmount;
  return { donationAmount: roundInr(donationAmount), gatewayFee: fee, grossAmount: gross, donorCoveredFee };
}
