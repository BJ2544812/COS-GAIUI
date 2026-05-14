import { Prisma } from '@prisma/client';

/** Two-decimal place money for accounting (matches DB DECIMAL(18,2)). */
export const MONEY_PLACES = 2;

export function toDecimal2(
  value: string | number | Prisma.Decimal | { toString: () => string }
): Prisma.Decimal {
  return new Prisma.Decimal(value.toString()).toDecimalPlaces(
    MONEY_PLACES,
    Prisma.Decimal.ROUND_HALF_UP
  );
}

export function decimalToNumber(
  d: string | number | Prisma.Decimal | { toString: () => string } | null | undefined
): number {
  if (d === null || d === undefined) return 0;
  return new Prisma.Decimal(d.toString())
    .toDecimalPlaces(MONEY_PLACES, Prisma.Decimal.ROUND_HALF_UP)
    .toNumber();
}
