# PayChangu Payment Integration - Implementation Summary

## Overview
This document describes the PayChangu mobile money payment integration implemented for UnityVault. The system supports Airtel Money and TNM Mpamba payments for admin subscriptions and member registration fees.

## What Has Been Implemented

### 1. Backend Infrastructure

#### Payment Service (`server/src/services/paymentService.ts`)
- **PaymentService** class that integrates with PayChangu API
- **Mock Mode**: Works without PayChangu API token (for development/testing)
- **Payment Methods**:
  - `initializePayment()` - Starts a new payment transaction
  - `verifyPayment()` - Checks payment status with PayChangu
  - `pollPaymentStatus()` - Auto-polls payment status every 30 seconds
- **Supported Payment Types**: subscription, registration, contribution, loan_repayment, penalty
- **Operators**: Airtel Money (09xxxxxxxx), TNM Mpamba (08xxxxxxxx)

#### Database Schema (`server/supabase/schema.sql`)
- New table: `payment_transactions`
- Fields include: charge_id, transaction_id, amount, phone, operator, status, provider, etc.
- Indexes for efficient querying by charge_id, customer, and status
- Row-level security enabled

#### Payment Repository
- **Interface**: `PaymentRepository` with CRUD operations
- **Supabase Implementation**: `repositories/supabase/paymentRepository.ts`
- **Memory Implementation**: `repositories/memory/paymentRepository.ts` (for testing)

#### Payment Controller (`server/src/controllers/paymentController.ts`)
- `POST /api/payments/initialize` - Initialize new payment
- `GET /api/payments/verify/:chargeId` - Verify payment status
- `GET /api/payments/history` - Get user's payment history
- `POST /api/payments/callback` - PayChangu webhook handler

#### Routes (`server/src/routes/payments.ts`)
- All payment endpoints properly routed
- Auth required for user endpoints
- Public callback endpoint for PayChangu

### 2. Configuration

#### Environment Variables (`server/src/config/env.ts`)
```typescript
  paychangu: {
    mockMode: process.env.PAYCHANGU_MOCK_MODE !== "false",
    apiToken: process.env.PAYCHANGU_API_TOKEN || "",
    apiUrl: process.env.PAYCHANGU_API_URL || "https://api.paychangu.com",
  }
```

**Required Environment Variables**:
- `PAYCHANGU_API_TOKEN` - Your PayChangu Bearer token
- `PAYCHANGU_API_URL` - PayChangu API URL (defaults to https://api.paychangu.com)
- `PAYCHANGU_MOCK_MODE` - Set `true` for simulated payments (default), `false` to use real API

### 3. Payment Flow

#### Current Flow (Without PayChangu)
Frontend → Mock Payment → Direct subscription/registration update

#### New Flow (With PayChangu)
1. **Frontend**: Collect payment details (phone, operator, amount)
2. **Frontend**: Call `/api/payments/initialize` with payment info
3. **Backend**: Initialize PayChangu payment (or mock if not configured)
4. **Backend**: Save transaction to database
5. **Backend**: Start auto-polling payment status
6. **Frontend**: Display payment initiated message
7. **Frontend**: Poll `/api/payments/verify/:chargeId` to check status
8. **Customer**: Receives mobile money prompt on phone
9. **Customer**: Enters PIN to confirm payment
10. **Backend**: Updates transaction status (via polling or webhook)
11. **Frontend**: Detects successful payment
12. **Frontend**: Calls existing subscription/registration endpoint
13. **Backend**: Updates admin/member payment status

## Frontend Integration Requirements

### 1. Update Admin Subscription Payment Page

**Current**: `src/pages/MemberRegistrationPayment.tsx` (used for both admin and member)

**Changes Needed**:
```typescript
const handlePay = async () => {
  // 1. Validate form
  // 2. Call /api/payments/initialize
  const response = await apiRequest("/payments/initialize", {
    method: "POST",
    body: {
      amount: isAdminSubscription ? 10000 : 5000,
      phone: form.mobileNumber,
      operator: mobileProvider, // 'airtel' or 'tnm'
      email: form.email,
      firstName: form.payerName.split(' ')[0],
      lastName: form.payerName.split(' ').slice(1).join(' '),
      paymentType: isAdminSubscription ? 'subscription' : 'registration'
    }
  });

  // 3. Store chargeId
  const chargeId = response.paymentInfo.chargeId;

  // 4. Show "Payment initiated" message
  toast.success("Payment request sent! Check your phone for the mobile money prompt.");

  // 5. Poll for payment status
  const pollInterval = setInterval(async () => {
    const verify = await apiRequest(`/payments/verify/${chargeId}`);
    
    if (verify.status === 'success') {
      clearInterval(pollInterval);
      // 6. Call existing subscription/registration endpoint
      if (isAdminSubscription) {
        await apiRequest("/admins/me/subscription-payment", { method: "POST" });
        navigate("/admin/members");
      } else {
        await apiRequest("/members/me/registration-payment", { method: "POST" });
        navigate("/dashboard");
      }
    } else if (verify.status === 'failed') {
      clearInterval(pollInterval);
      toast.error("Payment failed. Please try again.");
    }
  }, 5000); // Poll every 5 seconds
};
```

### 2. Payment Status Component

**Optional**: Create a dedicated payment status page that shows:
- Payment pending indicator
- Instructions to check phone
- Automatic status updates
- Timeout handling (stop after 5 minutes)

## API Endpoints

### Initialize Payment
```http
POST /api/payments/initialize
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 10000,
  "phone": "0991234567",
  "operator": "airtel",
  "email": "admin@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "paymentType": "subscription"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Payment initialized successfully",
  "paymentInfo": {
    "chargeId": "payment_xxxxx",
    "transactionId": "tx_xxxxx",
    "amount": "10000 MWK",
    "status": "pending",
    "provider": "Airtel Money",
    "phone": "0991234567",
    "charges": "500 MWK",
    "reference": "ref_xxxxx",
    "created": "2026-02-18T10:00:00Z"
  }
}
```

### Verify Payment
```http
GET /api/payments/verify/:chargeId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "status": "success",
  "message": "Payment completed successfully",
  "paymentInfo": {
    "chargeId": "payment_xxxxx",
    "amount": "10000 MWK",
    "status": "success",
    "completed": "2026-02-18T10:02:00Z"
  }
}
```

### Get Payment History
```http
GET /api/payments/history
Authorization: Bearer <token>
```

**Response**:
```json
{
  "status": "success",
  "message": "Found 5 payment(s)",
  "payments": [
    {
      "chargeId": "payment_xxxxx",
      "amount": "10000 MWK",
      "phone": "0991234567",
      "operator": "airtel",
      "status": "success",
      "paymentType": "subscription",
      "created": "2026-02-18T10:00:00Z",
      "completedAt": "2026-02-18T10:02:00Z"
    }
  ]
}
```

## Testing

### Without PayChangu Token (Mock Mode)
1. Set `PAYCHANGU_MOCK_MODE=true`
2. Leave `PAYCHANGU_API_TOKEN` empty
3. All payments will be automatically marked as successful
4. Console will show mock payment warnings
5. Payment records are still saved to database

### With PayChangu Token (Production)
1. Set `PAYCHANGU_MOCK_MODE=false`
2. Set `PAYCHANGU_API_TOKEN` in environment variables
3. Use valid Malawi phone numbers (08xxxxxxxx or 09xxxxxxxx)
4. Test with small amounts first
5. Check PayChangu dashboard for transaction records

## Database Migration

Run this SQL to add the payment_transactions table (already in schema.sql):
```sql
create table if not exists public.payment_transactions (
  id text primary key,
  charge_id text unique not null,
  transaction_id text,
  amount double precision not null,
  phone text not null,
  operator text not null,
  status text not null,
  provider text not null,
  charges double precision,
  reference text not null,
  created timestamptz not null default now(),
  last_checked timestamptz,
  completed_at timestamptz,
  customer_id text not null,
  customer_type text not null,
  payment_type text not null,
  email text,
  first_name text,
  last_name text
);
```

## Next Steps (For Complete Integration)

1. **Frontend Updates**:
   - Update `MemberRegistrationPayment.tsx` to use new payment flow
   - Add payment status polling
   - Add timeout handling
   - Show appropriate loading/success/error messages

2. **Testing**:
   - Test mock payments (without PayChangu token)
   - Test with PayChangu sandbox/test environment
   - Test payment status polling
   - Test payment failure scenarios

3. **Production**:
   - Add PayChangu API token to production environment
   - Monitor payment transactions
   - Set up PayChangu webhook endpoint
   - Handle payment expiry (after 20 polling attempts)

## Security Considerations

- ✅ Authentication required for all user endpoints
- ✅ Users can only access their own payments
- ✅ Payment validation (phone format, operator)
- ✅ Row-level security on database
- ✅ API token stored in environment variables
- ⚠️ Webhook endpoint is public (required by PayChangu)
- ⚠️ Add webhook signature validation (future enhancement)

## Current Status

### ✅ Completed
- Payment service with PayChangu integration
- Database schema and repositories
- API endpoints and routes
- Mock payment support
- Payment status polling
- Error handling

### ⚠️ Pending
- Frontend integration (update payment pages)
- Payment status polling UI
- Comprehensive testing
- Webhook signature validation
- Production deployment

## Notes

- The system gracefully falls back to mock payments if PayChangu is not configured
- All existing functionality continues to work
- Payment history is preserved in database
- Auto-polling runs for up to 20 attempts (10 minutes)
- Phone number validation enforces Malawi formats
- All monetary amounts are in Malawian Kwacha (MWK)
