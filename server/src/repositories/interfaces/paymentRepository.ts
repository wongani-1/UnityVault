import type { PaymentTransaction } from "../../services/paymentService";

export type PaymentRepository = {
  create: (payment: PaymentTransaction) => Promise<PaymentTransaction>;
  getById: (id: string) => Promise<PaymentTransaction | undefined>;
  getByChargeId: (chargeId: string) => Promise<PaymentTransaction | undefined>;
  listByCustomer: (customerId: string, customerType: "admin" | "member") => Promise<PaymentTransaction[]>;
  update: (chargeId: string, patch: Partial<PaymentTransaction>) => Promise<PaymentTransaction | undefined>;
};
