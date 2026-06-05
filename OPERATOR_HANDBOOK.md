# Kingdom Church OS — Operator Handbook (v1.0)

For coordinators, pastors, and ministry staff running day-to-day operations.

## Principles

- **Calm under pressure** — empty states guide next steps; destructive actions require confirmation.
- **One source of truth** — command center aggregates Sunday, volunteers, events, and care signals.
- **Realtime when it matters** — Sunday Mode and live event ops refresh via Socket.IO; reconnect is automatic.

## Command center

Open **Operations → Command center** for the live operational picture:

- Sunday service status and attendance signals
- Open volunteer gaps and assignments
- Prayer and care queue highlights
- Workflow failures requiring attention

Use the **campus filter** when operating a multi-campus church.

## Sunday Mode

1. Select the active service from the picker.
2. Advance the run sheet step-by-step; each advance is saved immediately.
3. Capture emergencies or issues inline — they appear in command center incidents.
4. If data looks stale, use **Retry load**; realtime will reconnect automatically after network blips.

See [SUNDAY_OPERATIONS_GUIDE.md](SUNDAY_OPERATIONS_GUIDE.md) for detailed Sunday workflows.

## Events & volunteers

- **Events** — create services and gatherings; empty state prompts first event creation.
- **Volunteers** — board shows assignments; empty state directs you to add responsibilities.
- **Attendance** — open a session before counting; low-data states explain how to start a session.

## Communication

- **Command** tab — hub metrics and recent campaigns.
- **Compose** — select channels, audience filters, then confirm send (destructive broadcast protection).
- **Prayer** — triage requests; assign and resolve with audit trail.

Success feedback appears briefly after a confirmed campaign send.

## Outreach & care

- Register visitors; follow-ups appear on the dashboard.
- Empty follow-up list means no pending pastoral tasks — register a visitor to start the pipeline.

## Member portal & website

- **Website** module manages public pages and giving presentation.
- **Member portal** settings control what members see when signed in.

## When something fails

1. Check the connection indicator in Sunday Mode or command center.
2. Open **System admin center → Incidents** for workflow failures and degraded services.
3. Retry the action; if workflows failed, an admin can replay from the operator toolkit.
4. See [RECOVERY_GUIDE.md](RECOVERY_GUIDE.md) for backup and maintenance procedures.

## Getting help

- In-app guidance banners appear on major operational modules.
- Global search (⌘/Ctrl+K) finds members, volunteers, prayers, outreach contacts, and workflows.
- Admins: [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
