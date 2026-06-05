# TEST_MY_CHURCH_OS — Guided Evaluation Checklist

A church can evaluate Ultimate Church OS in **under 30 minutes** by combining a **role tour** (5–10 min) with this checklist (15–20 min). Open it in the app: **Academy → TEST_MY_CHURCH_OS**.

- Check items as you complete them (saved in browser localStorage).
- Use **Go** on each row to jump to the right module.
- Progress bar shows % complete across all sections.

**Demo church:** Grace Community Church · See `DEMO_CHURCH_GUIDE.md` and `LOGIN_MATRIX.md`.

---

## Members

- [ ] **View members list** — Members module; scan the directory.
- [ ] **Open a member profile** — Click any row (e.g. Priya Paul or Ravi Nair).
- [ ] **Edit member details** — Use profile edit controls.
- [ ] **View a linked family** — Families module; open Nair or Paul household.
- [ ] **Add or view a pastoral note** — Pastoral Care module.

---

## Events

- [ ] **Create or open an event** — Events; open Sunday Worship or create a test event.
- [ ] **Add or review volunteers on an event** — Volunteers module or event workspace.
- [ ] **Move event toward approved / live status** — Event workspace setup checklist.
- [ ] **Open Sunday Service for a worship event** — Sunday Service; select 9 AM service.

---

## Attendance

- [ ] **Open an attendance session** — Attendance module.
- [ ] **Record a check-in** — Add or confirm a check-in on the session.

---

## Finance

- [ ] **Record a gift** — Giving module.
- [ ] **Create a voucher** — Finance → Vouchers.
- [ ] **Approve a voucher** — Finance → Approvals (if your role allows).
- [ ] **Review a budget or fund** — Budgets module.

---

## Communications

- [ ] **Review campaigns or compose a message** — Communications module.
- [ ] **View prayer requests** — Communications prayer views.

---

## HR & Staff

- [ ] **Open staff directory** — HR & Staff → Staff directory (e.g. Ravi Nair employment).
- [ ] **Review leave requests** — HR leave tab.

---

## Website

- [ ] **Open website builder** — Website module in admin.
- [ ] **Preview public home page** — Open `/` in a new tab (no login).

---

## Suggested order by evaluator role

| Evaluator | Suggested focus sections first |
|-----------|--------------------------------|
| Senior Pastor | Members → Attendance → Events → Finance (view) → Communications |
| Church Administrator | Events → Attendance → Members → Communications → Website |
| Finance Manager | Finance → Members (view) → Events (view) |
| HR Manager | HR → Members → Finance (payroll touchpoint) |
| Volunteer Coordinator | Events → Attendance → Members |

The in-app **Show me what to test next** button prioritizes sections based on your logged-in role after the role tour is complete.

---

## Success criteria

- [ ] At least **80%** of checklist items marked complete.
- [ ] One **Sunday Service** stop visited during a service-type event.
- [ ] One **finance** flow (gift + voucher or approval) exercised.
- [ ] One **people** flow (member + family) exercised.

Reset progress: use **Reset checklist** in Academy (clears localStorage key `church_test_my_church_os_v1`).

---

*In-app source: `src/lib/churchTestChecklist.ts` · UI: `TestChecklistPanel.tsx`*
