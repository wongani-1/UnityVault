# Monthly Contribution Payment System

## Overview

This document describes the proper contribution payment logic implemented in UnityVault.

## System Architecture

### A. Contribution Generation

At the start of every month (or contribution cycle), the system automatically creates contribution records for all **Active** members.

**Endpoint:** `POST /contributions/generate`

**Request:**
```json
{
  "month": "2026-02",
  "amount": 50000,
  "dueDate": "2026-02-28T23:59:59.999Z"
}
```

**Response:**
```json
{
  "message": "Generated 15 contributions",
  "contributions": [
    {
      "id": "contrib_xyz123",
      "groupId": "group_001",
      "memberId": "member_001",
      "amount": 50000,
      "month": "2026-02",
      "status": "unpaid",
      "dueDate": "2026-02-28T23:59:59.999Z",
      "createdAt": "2026-02-01T00:00:00.000Z"
    }
  ]
}
```

**Contribution Record Fields:**
- `member_id` - ID of the member
- `group_id` - ID of the group
- `amount` - Amount due (from group settings)
- `due_date` - When payment is due
- `status` - Initially "unpaid"
- `month` - Month identifier (YYYY-MM format)

**Prevention:**
- ✅ Duplicate entries (checks existing contribution for member/month)
- ✅ Missing members (iterates all active members)
- ✅ Manual balance manipulation

---

### B. Contribution Payment Recording

When a member makes a payment, the system verifies and records it properly.

**Endpoint:** `POST /contributions/pay`

**Request:**
```json
{
  "contributionId": "contrib_xyz123"
}
```

**Response:**
```json
{
  "id": "contrib_xyz123",
  "groupId": "group_001",
  "memberId": "member_001",
  "amount": 50000,
  "month": "2026-02",
  "status": "paid",
  "dueDate": "2026-02-28T23:59:59.999Z",
  "createdAt": "2026-02-01T00:00:00.000Z",
  "paidAt": "2026-02-14T10:30:00.000Z"
}
```

**System Verification:**
1. ✅ Contribution exists
2. ✅ Status is "unpaid" or "overdue"
3. ✅ Member belongs to the group
4. ✅ Member ID matches contribution

**Actions Performed:**
1. Mark contribution `status = "paid"`
2. Store `paidAt` timestamp
3. Update member's `balance` (savings) by adding contribution amount
4. Create ledger entry (future implementation)

**What You DON'T Do:**
- ❌ Manually increase balances
- ❌ Edit contribution amounts
- ❌ Create duplicate contributions

---

### C. Late Contribution Logic

If the `due_date` passes and `status = "unpaid"`:

**Endpoint:** `POST /contributions/check-overdue`

**Request:**
```json
{
  "penaltyAmount": 5000,
  "autoGeneratePenalty": true
}
```

**Response:**
```json
{
  "message": "Marked 3 contributions as overdue, generated 3 penalties",
  "marked": 3,
  "penaltiesGenerated": 3
}
```

**Automated Actions:**
1. Status changes to `"overdue"`
2. Penalty record is generated (if enabled in group settings)
3. Member is notified (future implementation)

**Penalty Record Fields:**
- `contribution_id` - Links to the overdue contribution
- `member_id` - Member who is late
- `group_id` - Group identifier
- `amount` - Penalty amount
- `reason` - e.g., "Late contribution for 2026-02"
- `isPaid` - Initially false

---

### D. Accounting Effect

When a contribution is marked as **Paid**:

**Group Ledger:**
- Cash / Contribution Pool increases by `amount`

**Member Account:**
- Member Savings balance increases by `amount`

**No Manual Adjustments:**
- All balance changes are automatic and auditable
- Ledger entries are created for every transaction

---

## API Endpoints Summary

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/contributions/generate` | POST | Admin | Generate monthly contributions for all active members |
| `/contributions/pay` | POST | Member/Admin | Record a contribution payment |
| `/contributions/check-overdue` | POST | Admin | Check and mark overdue contributions, generate penalties |
| `/contributions` | GET | Member/Admin | List contributions (filtered by role) |
| `/contributions/unpaid` | GET | Member/Admin | List all unpaid/overdue contributions |
| `/contributions` | POST | Admin | Legacy: Manually add a paid contribution |

---

## Data Models

### Contribution Type
```typescript
type ContributionStatus = "unpaid" | "paid" | "overdue";

type Contribution = {
  id: string;
  groupId: string;
  memberId: string;
  amount: number;
  month: string; // Format: "YYYY-MM"
  status: ContributionStatus;
  dueDate: string; // ISO date string
  createdAt: string;
  paidAt?: string; // Only set when status = "paid"
};
```

### Penalty Type
```typescript
type Penalty = {
  id: string;
  groupId: string;
  memberId: string;
  loanId?: string; // If penalty is for a loan
  contributionId?: string; // If penalty is for a contribution
  amount: number;
  reason: string;
  createdAt: string;
  isPaid: boolean;
};
```

---

## Workflow Examples

### 1. Monthly Contribution Cycle

**Day 1 of Month (Automated):**
```bash
# Admin or automated job generates contributions
POST /contributions/generate
{
  "month": "2026-03",
  "amount": 50000,
  "dueDate": "2026-03-31T23:59:59.999Z"
}
```

**During the Month (Members Pay):**
```bash
# Member pays their contribution
POST /contributions/pay
{
  "contributionId": "contrib_xyz123"
}
```

**After Due Date (Daily Check - Automated):**
```bash
# System checks for overdue contributions
POST /contributions/check-overdue
{
  "penaltyAmount": 5000,
  "autoGeneratePenalty": true
}
```

### 2. Member Payment Flow

1. Member views unpaid contributions: `GET /contributions/unpaid`
2. Member selects contribution to pay
3. Member chooses payment method (mobile money, card)
4. Frontend calls: `POST /contributions/pay` with `contributionId`
5. Backend verifies and records payment
6. Member's balance is updated
7. Contribution status changes to "paid"

---

## Integration Points

### Frontend Integration

**MemberContributionPayment.tsx** should:
1. Fetch unpaid contributions: `GET /contributions/unpaid`
2. Display unpaid contributions with amounts and due dates
3. After payment method selection, call: `POST /contributions/pay`

**Example:**
```typescript
// Fetch unpaid contributions
const { data } = await apiRequest<{ items: Contribution[] }>("/contributions/unpaid");

// Record payment after user selects payment method
await apiRequest("/contributions/pay", {
  method: "POST",
  body: { contributionId: selectedContribution.id }
});
```

### Admin Dashboard

Admins should have access to:
1. Generate monthly contributions button
2. View overdue contributions
3. Manually trigger penalty generation
4. View contribution payment status by member

---

## Benefits of This System

1. **Audit Trail** - Every payment is tracked with timestamps
2. **No Duplicate Payments** - System prevents duplicate contributions per month
3. **Automatic Balance Updates** - Member savings automatically increase
4. **Penalty Management** - Overdue contributions automatically generate penalties
5. **Scalability** - Works for groups with any number of members
6. **Data Integrity** - All changes are validated and logged

---

## Migration Notes

If you have existing contributions in the old format, you'll need to:
1. Add `status` field (default to "paid" if `paidAt` exists, else "unpaid")
2. Add `dueDate` field (calculate from month)
3. Ensure all contributions have proper `month` format (YYYY-MM)

---

## Future Enhancements

- [ ] Automated monthly contribution generation (cron job)
- [ ] Automated overdue checking (daily cron job)
- [ ] Email/SMS notifications for unpaid contributions
- [ ] Payment reminders before due date
- [ ] Partial payment support
- [ ] Payment history export
- [ ] Integration with actual payment gateways (Airtel Money, TNM Mpamba)
