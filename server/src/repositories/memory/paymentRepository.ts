import type { PaymentRepository } from "../interfaces/paymentRepository";
import type { PaymentTransaction } from "../../services/paymentService";
import { store } from "./store";

export const paymentRepository: PaymentRepository = {
  async create(payment: PaymentTransaction) {
    store.paymentTransactions.set(payment.id, payment);
    return payment;
  },

  async getById(id: string) {
    return store.paymentTransactions.get(id);
  },

  async getByChargeId(chargeId: string) {
    const payments = Array.from(store.paymentTransactions.values());
    return payments.find((payment) => payment.chargeId === chargeId);
  },

  async listByCustomer(customerId: string, customerType: "admin" | "member") {
    const payments = Array.from(store.paymentTransactions.values());
    return payments
      .filter((payment) => payment.customerId === customerId && payment.customerType === customerType)
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  },

  async update(chargeId: string, patch: Partial<PaymentTransaction>) {
    const current = await this.getByChargeId(chargeId);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    store.paymentTransactions.set(current.id, updated);
    return updated;
  },
};
