# Kingdom Church OS — Future Roadmap

Non-blocking enhancements after go-live stabilization. Core architecture remains event-driven, tenant-isolated, and finance-safe.

## Optional integrations

- SMS/WhatsApp providers (beyond current log-and-queue adapters)
- Calendar sync (Google/Outlook) for events and volunteer shifts
- Accounting export to Tally / Zoho Books
- SSO (SAML/OIDC) for enterprise churches

## Advanced SaaS

- Usage-based billing meters per campus
- White-label member portal domains
- Multi-region active-active with read replicas
- Customer-managed encryption keys

## Intelligence enhancements

- Predictive volunteer fill from historical no-show rates
- Cross-campus staffing recommendations
- Automated pastoral triage scoring (with human-in-the-loop)

## Operational scale

- Dedicated load-test harness (500+ socket clients)
- External observability (Datadog/CloudWatch) on `structuredLog`
- PagerDuty/Slack on critical incidents

## UX

- Native mobile apps (portal + Sunday Mode offline cache)
- Drag-and-drop volunteer scheduling board
- Voice-driven backstage cues (experimental)

Prioritize based on customer contracts; do not block current production deployments.
