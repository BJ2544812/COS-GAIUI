export type AddressFields = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateRegion?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function formatAddressLine(a: AddressFields): string {
  const parts = [
    a.addressLine1,
    a.addressLine2,
    [a.city, a.stateRegion].filter(Boolean).join(', '),
    a.postalCode,
    a.country && a.country !== 'India' ? a.country : null,
  ].filter((p) => p && String(p).trim());
  return parts.join(', ') || '';
}

export function googleMapsUrl(a: AddressFields): string | null {
  if (a.latitude != null && a.longitude != null && !Number.isNaN(a.latitude) && !Number.isNaN(a.longitude)) {
    return `https://www.google.com/maps?q=${a.latitude},${a.longitude}`;
  }
  const line = formatAddressLine(a);
  if (!line) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(line)}`;
}
