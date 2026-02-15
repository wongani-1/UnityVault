# Penalty Payment Logic - Complete Implementation

## Overview
This document describes the comprehensive penalty payment logic system with proper accounting that ensures penalties increase group income but **do NOT** increase member savings balance.

## Penalty Structure

### Type Definition
```typescript
export type PenaltyStatus = "unpaid" | "paid";

export type Penalty = {
  id: string;
  groupId: string;
  memberId: string;
  loanId?: string;              // Link to loan if from loan installment
  installmentId?: string;        // Link to specific installment
  contributionId?: string;       // Link to contribution if from late contribution
  amount: number;
  reason: string;
  status: PenaltyStatus;
  dueDate: string;              // When penalty should be paid (default: 7 days)
  createdAt: string;
  paidAt?: string;              // When penalty was actually paid
  isPaid: boolean;              // Kept for backward compatibility
};
```

### Penalty Origins
Penalties can originate from two sources:

1. **Late Contributions**: When a monthly contribution is not paid by the due date
2. **Late Loan Installments**: When a loan installment payment is not made by the due date

### Key Fields
- `penalty_id`: Unique identifier for the penalty
- `linked_to`: Either `contributionId` or `installmentId` to track the source
- `amount`: Calculated as penalty rate × original amount (e.g., 10% of contribution/installment)
- `due_date`: Set to 7 days from penalty creation by default
- `status`: "unpaid" or "paid"

## A. Penalty Recording

### When Created
When a penalty is created (automatically by the system):

1. **Status**: Set to "unpaid"
2. **Due Date**: Set to 7 days from creation
3. **Member Link**: Linked to the specific member
4. **Group Link**: Linked to the group
5. **Source Link**: Linked to the contribution or installment that caused it
6. **Amount**: Calculated based on group's penalty rate setting

### Implementation
```typescript
// In PenaltyService.create()
const penalty: Penalty = {
  id: createId("penalty"),
  status: "unpaid",
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  isPaid: false,
  // ... other fields
};
```

### Member Impact
When a penalty is created:
- Member's `penaltiesTotal` is increased by the penalty amount
- This tracks the liability but does NOT affect their savings balance

## B. Penalty Payment

### Payment Process
When a penalty is paid (by member or admin):

1. **Verification**: 
   - Check penalty exists
   - Verify member authorization
   - Ensure status is "unpaid"
   
2. **Status Update**:
   - Set `status` to "paid"
   - Set `isPaid` to true
   - Record `paidAt` timestamp

3. **Transaction Recording**:
   - Create a Transaction record with type "penalty_payment"
   - Record double-entry accounting details

4. **Financial Updates**:
   - Decrease member's `penaltiesTotal`
   - Increase group's `totalIncome`
   - Increase group's `cash`

### Implementation
```typescript
// In PenaltyService.payPenalty()
const paidAt = new Date().toISOString();

// Update penalty
penaltyRepository.update(penaltyId, { 
  isPaid: true,
  status: "paid",
  paidAt 
});

// Update member
memberRepository.update(memberId, {
  penaltiesTotal: member.penaltiesTotal - penalty.amount,
});

// Create transaction
const transaction: Transaction = {
  type: "penalty_payment",
  memberSavingsChange: 0,           // NO savings increase
  groupIncomeChange: penalty.amount, // Increases group income
  groupCashChange: penalty.amount,   // Increases group cash
  // ... other fields
};

// Update group
groupRepository.update(groupId, {
  totalIncome: group.totalIncome + penalty.amount,
  cash: group.cash + penalty.amount,
});
```

## C. Accounting Effect

### Critical Distinction
**Penalty payments increase Group Income but do NOT increase Member Savings balance.**

This is the key difference from contribution payments:
- **Contribution Payment**: Increases both member savings AND group cash
- **Penalty Payment**: Increases only group income AND group cash

### Transaction Record
Every penalty payment creates a Transaction record with:
- `type`: "penalty_payment"
- `memberSavingsChange`: **0** (no change to member savings)
- `groupIncomeChange`: penalty amount (increases group income)
- `groupCashChange`: penalty amount (increases available cash)

### Financial Flow
```
Member pays penalty of 5,000
├─ Member's penaltiesTotal: -5,000 (liability reduced)
├─ Member's balance: 0 (NO CHANGE - important!)
├─ Group's totalIncome: +5,000 (income increased)
└─ Group's cash: +5,000 (cash available increased)
```

### Group Financial Tracking
```typescript
export type Group = {
  id: string;
  name: string;
  settings: GroupSettings;
  totalSavings: number;  // Member savings (from contributions only)
  totalIncome: number;   // Interest + penalties + fees
  cash: number;          // Available cash (savings + income - loans)
};
```

## Transaction System

### Transaction Type
```typescript
export type TransactionType = 
  | "contribution"        // Member contribution payment
  | "loan_disbursement"   // Loan given to member
  | "loan_repayment"      // Loan installment payment
  | "penalty_payment"     // Penalty payment
  | "initial_deposit";    // Initial group capital

export type Transaction = {
  id: string;
  groupId: string;
  memberId: string;
  type: TransactionType;
  amount: number;
  description: string;
  // Double-entry accounting
  memberSavingsChange: number;  // Change to member's savings
  groupIncomeChange: number;    // Change to group's income
  groupCashChange: number;      // Change to group's cash
  // Entity references
  contributionId?: string;
  loanId?: string;
  installmentId?: string;
  penaltyId?: string;
  createdAt: string;
  createdBy: string;
};
```

### Accounting Examples

#### Contribution Payment (50,000)
```typescript
{
  type: "contribution",
  amount: 50000,
  memberSavingsChange: 50000,   // Member savings increase
  groupIncomeChange: 0,          // No income
  groupCashChange: 50000,        // Cash increases
}
```

#### Penalty Payment (5,000)
```typescript
{
  type: "penalty_payment",
  amount: 5000,
  memberSavingsChange: 0,        // NO savings increase
  groupIncomeChange: 5000,       // Income increases
  groupCashChange: 5000,         // Cash increases
}
```

#### Loan Repayment (52,500 = 50k principal + 2.5k interest)
```typescript
{
  type: "loan_repayment",
  amount: 52500,
  memberSavingsChange: 50000,    // Principal goes to savings
  groupIncomeChange: 2500,       // Interest is income
  groupCashChange: 52500,        // Full amount to cash
}
```

## API Endpoints

### Pay Penalty
```
POST /api/penalties/:id/pay
Authorization: Bearer {token}
```

**Response:**
```json
{
  "penalty": {
    "id": "penalty_123",
    "status": "paid",
    "paidAt": "2026-02-14T10:30:00Z",
    "amount": 5000,
    "reason": "Late contribution for 2026-02"
  }
}
```

## Frontend Integration

The penalty payment is integrated into the unified payment page at `src/pages/MemberContributionPayment.tsx`:

```typescript
case 'penalty':
  await apiRequest(`/penalties/${paymentInfo.itemId}/pay`, {
    method: "POST",
  });
  toast.success("Penalty payment recorded successfully!");
```

## Automatic Penalty Generation

Penalties are automatically created when:

1. **Overdue Contributions**: System automatically checks when contributions are accessed
   - Marks unpaid contributions past due date as "overdue"
   - Creates penalties based on group's contribution penalty rate (only once per contribution)
   - Applies percentage-based penalty (e.g., 10% of contribution amount)
   
2. **Overdue Installments**: System automatically checks when loan data is accessed
   - Marks unpaid installments past due date as "overdue"
   - Creates penalties based on group's loan penalty rate (only once per installment)
   - Applies percentage-based penalty (e.g., 15% of installment amount)

**Note**: The system automatically processes overdue checks whenever:
- Contribution data is fetched (member or admin viewing contributions)
- Loan data is fetched (member or admin viewing loans)
- Loan eligibility is checked
- Member list is accessed (triggers both contribution and loan checks)
- No manual admin intervention required

## Key Implementation Files

1. **Type Definitions**: `server/src/models/types.ts`
   - Penalty, PenaltyStatus, Transaction, TransactionType

2. **Penalty Service**: `server/src/services/penaltyService.ts`
   - create() - Creates new penalty with proper initial state
   - payPenalty() - Handles payment with accounting

3. **Transaction Repository**: 
   - `server/src/repositories/interfaces/transactionRepository.ts`
   - `server/src/repositories/memory/transactionRepository.ts`

4. **Controllers**: `server/src/controllers/penaltyController.ts`
   - payPenalty() - API endpoint handler

5. **Routes**: `server/src/routes/penalties.ts`
   - POST /penalties/:id/pay

6. **Frontend**: `src/pages/MemberContributionPayment.tsx`
   - Unified payment page for all payment types

## Testing

To test the penalty payment flow:

1. Create a test penalty (automatically via overdue check)
2. Navigate to "Make Payments" → "Penalty"
3. Select a penalty and make payment
4. Verify:
   - Penalty status changes to "paid"
   - Member's penaltiesTotal decreases
   - **Member's balance does NOT change**
   - Group's totalIncome increases
   - Group's cash increases
   - Transaction record is created

## Audit Trail

All penalty payments are tracked in the audit log and transaction history, providing:
- Who paid the penalty
- When it was paid
- Amount paid
- Which contribution/installment it was related to
- Full accounting details

This ensures transparency and accountability in the group's financial operations.
