# Settings & Financial Configuration Hardening Report

**Status:** Complete  
**Lint:** `npm run lint` — clean

## Summary

Production usability pass on System Settings: persistence, validation, uploads, financial account management, and Cashfree configuration — without architecture changes.

## Fixes delivered

### Settings persistence
- **Operational settings** now validated and saved (`operationalSchema` + controller merge).
- Save payload **strips `_meta`** and unknown keys server-side (`SETTINGS_SECTION_KEYS`).
- **System schema** includes `auditLogging` and `dataRetentionDays`.
- **Branding** extended: `emailHeaderLogo`, `publicTagline`, `favicon`, `emailFooterText`.
- **Payment gateway** extended: `thankYouMessage`, `donorConfirmationEmail`, `recurringGivingEnabled`.
- **Currency** validation allows INR and USD (matches UI).

### File uploads
- Upload route: **tenant middleware**, 5MB limit, image types only.
- **Local disk fallback** when MinIO is unavailable (`/uploads/{tenant}/settings/...`).
- `BrandingUploadField` component with progress, validation, and remove.

### Financial configuration
- **Chart of accounts** panel in Settings → Financial: create accounts, archive (zero balance only).
- `PATCH /finance/accounts/:id` for safe name/archive updates with audit log.
- Period lock uses **ConfirmDialog** before first enable.

### Online giving (Cashfree)
- `POST /settings/test-cashfree` — credential ping without saving.
- UI: test button, thank-you message, donor email toggle, recurring toggle.
- Webhook path documented in UI.

### UX
- Loading state while settings fetch.
- `OpsFeedback` on success; inline errors on failure.
- Account dropdowns refresh after chart changes.

## Validation

```bash
npm run lint
npm run verify:v1          # API up
npm run test:pw -- e2e/settings-hardening.spec.ts
```

## Operator notes

1. Open **Settings** → configure sections → **Save All Settings**.
2. Upload logos under **Organization** and **Branding**; save after upload.
3. Map default accounts under **Financial**; add accounts in the chart panel if needed.
4. Configure Cashfree under **Online Giving** → **Test Cashfree connection** → save.
