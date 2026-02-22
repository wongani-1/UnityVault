import { env } from "../config/env";
import { ApiError } from "../utils/apiError";
import { createId } from "../utils/id";

export type PaymentOperator = "airtel" | "tnm";

export type PaymentStatus = "pending" | "success" | "failed" | "expired";

export type PaymentTransaction = {
  id: string;
  chargeId: string;
  transactionId?: string;
  amount: number;
  phone: string;
  operator: PaymentOperator;
  status: PaymentStatus;
  provider: string;
  charges?: number;
  reference: string;
  created: string;
  lastChecked?: string;
  completedAt?: string;
  customerId: string;
  customerType: "admin" | "member";
  paymentType: "subscription" | "registration" | "contribution" | "loan_repayment" | "penalty";
  email?: string;
  first_name?: string;
  last_name?: string;
};

interface PayChanguInitResponse {
  status: string;
  message: string;
  data?: {
    tx_ref: string;
    provider: string;
    amount: string;
    phone: string;
    charges: string;
    created: string;
  };
}

interface PayChanguVerifyResponse {
  status: string;
  message: string;
  data?: {
    tx_ref: string;
    provider: string;
    amount: string;
    phone: string;
    charges: string;
    created: string;
    status: string;
  };
}

export class PaymentService {
  private apiUrl: string;
  private apiToken: string;
  private mockMode: boolean;

  constructor() {
    this.apiUrl = env.paychangu.apiUrl;
    this.apiToken = env.paychangu.apiToken;
    this.mockMode = env.paychangu.mockMode;

    if (this.mockMode) {
      console.warn("PayChangu mock mode is enabled. Payment processing will be simulated.");
    } else if (!this.apiToken) {
      console.warn("PayChangu API token not configured. Payment processing will be simulated.");
    }
  }

  async initializePayment(params: {
    amount: number;
    phone: string;
    operator: PaymentOperator;
    email: string;
    first_name: string;
    last_name: string;
    customerId: string;
    customerType: "admin" | "member";
    paymentType: "subscription" | "registration" | "contribution" | "loan_repayment" | "penalty";
    callbackUrl?: string;
    returnUrl?: string;
  }): Promise<PaymentTransaction> {
    // Validate operator
    if (!["airtel", "tnm"].includes(params.operator)) {
      throw new ApiError("Invalid mobile money operator. Use 'airtel' or 'tnm'", 400);
    }

    // Validate phone number format
    const phoneRegex = /^(09|08)\d{8}$/;
    if (!phoneRegex.test(params.phone)) {
      throw new ApiError("Invalid phone number format. Must be 10 digits starting with 08 or 09", 400);
    }

    const chargeId = createId("payment");
    const reference = createId("ref");

    // Return mock success when mock mode is enabled or token is not configured
    if (this.mockMode || !this.apiToken) {
      const mockTransaction: PaymentTransaction = {
        id: chargeId,
        chargeId,
        transactionId: `MOCK_${Date.now()}`,
        amount: params.amount,
        phone: params.phone,
        operator: params.operator,
        status: "success",
        provider: params.operator === "airtel" ? "Airtel Money" : "TNM Mpamba",
        charges: params.amount * 0.05,
        reference,
        created: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        customerId: params.customerId,
        customerType: params.customerType,
        paymentType: params.paymentType,
        email: params.email,
        first_name: params.first_name,
        last_name: params.last_name,
      };
      
      console.log("⚠️  Mock payment created:", mockTransaction);
      return mockTransaction;
    }

    try {
      const paymentData = {
        amount: params.amount,
        phone: params.phone,
        operator: params.operator,
        email: params.email,
        first_name: params.first_name,
        last_name: params.last_name,
        callbackUrl: params.callbackUrl || `${env.appBaseUrl}/api/payment/callback`,
        returnUrl: params.returnUrl || `${env.appBaseUrl}/payment/complete`,
      };

      const response = await fetch(`${this.apiUrl}/payment/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PayChangu API error: ${response.status} - ${errorText}`);
      }

      const result: PayChanguInitResponse = await response.json();

      if (result.status !== "success" || !result.data) {
        throw new Error(result.message || "Payment initialization failed");
      }

      const transaction: PaymentTransaction = {
        id: chargeId,
        chargeId,
        transactionId: result.data.tx_ref,
        amount: parseFloat(result.data.amount),
        phone: result.data.phone,
        operator: params.operator,
        status: "pending",
        provider: result.data.provider,
        charges: parseFloat(result.data.charges || "0"),
        reference,
        created: result.data.created || new Date().toISOString(),
        customerId: params.customerId,
        customerType: params.customerType,
        paymentType: params.paymentType,
        email: params.email,
        first_name: params.first_name,
        last_name: params.last_name,
      };

      return transaction;
    } catch (error) {
      console.error("PayChangu initialization error:", error);
      throw new ApiError(
        error instanceof Error ? error.message : "Failed to initialize payment",
        500
      );
    }
  }

  async verifyPayment(chargeId: string): Promise<PaymentTransaction> {
    // Mock verification is not needed in mock mode because transactions complete immediately
    if (this.mockMode || !this.apiToken) {
      throw new ApiError("Payment not found", 404);
    }

    try {
      const response = await fetch(`${this.apiUrl}/payment/verify/${chargeId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`PayChangu API error: ${response.status}`);
      }

      const result: PayChanguVerifyResponse = await response.json();

      if (!result.data) {
        throw new Error("Invalid verification response");
      }

      const transaction: Partial<PaymentTransaction> = {
        transactionId: result.data.tx_ref,
        amount: parseFloat(result.data.amount),
        phone: result.data.phone,
        provider: result.data.provider,
        charges: parseFloat(result.data.charges || "0"),
        status: this.mapPayChanguStatus(result.data.status),
        lastChecked: new Date().toISOString(),
      };

      if (transaction.status === "success" || transaction.status === "failed") {
        transaction.completedAt = new Date().toISOString();
      }

      return transaction as PaymentTransaction;
    } catch (error) {
      console.error("PayChangu verification error:", error);
      throw new ApiError(
        error instanceof Error ? error.message : "Failed to verify payment",
        500
      );
    }
  }

  private mapPayChanguStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      "pending": "pending",
      "successful": "success",
      "success": "success",
      "failed": "failed",
      "expired": "expired",
    };
    return statusMap[status.toLowerCase()] || "pending";
  }

  async pollPaymentStatus(
    chargeId: string,
    onStatusChange: (transaction: PaymentTransaction) => Promise<void>,
    maxAttempts: number = 20
  ): Promise<void> {
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.log(`Payment polling stopped for ${chargeId} - max attempts reached`);
        return;
      }

      attempts++;

      try {
        const transaction = await this.verifyPayment(chargeId);
        await onStatusChange(transaction);

        if (transaction.status === "success" || transaction.status === "failed") {
          console.log(`Payment ${chargeId} completed with status: ${transaction.status}`);
          return;
        }

        // Continue polling every 30 seconds
        setTimeout(poll, 30000);
      } catch (error) {
        console.error(`Error polling payment ${chargeId}:`, error);
        setTimeout(poll, 30000);
      }
    };

    // Start polling
    poll();
  }
}
