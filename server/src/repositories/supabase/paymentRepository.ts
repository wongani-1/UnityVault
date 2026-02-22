import type { PaymentRepository } from "../interfaces/paymentRepository";
import { requireSupabase } from "../../db/supabaseClient";
import type { PaymentTransaction } from "../../services/paymentService";

type PaymentTransactionRow = {
  id: string;
  charge_id: string;
  transaction_id?: string | null;
  amount: number;
  phone: string;
  operator: string;
  status: string;
  provider: string;
  charges?: number | null;
  reference: string;
  created: string;
  last_checked?: string | null;
  completed_at?: string | null;
  customer_id: string;
  customer_type: string;
  payment_type: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

const fromPaymentRow = (row: PaymentTransactionRow): PaymentTransaction => ({
  id: row.id,
  chargeId: row.charge_id,
  transactionId: row.transaction_id || undefined,
  amount: row.amount,
  phone: row.phone,
  operator: row.operator as "airtel" | "tnm",
  status: row.status as "pending" | "success" | "failed" | "expired",
  provider: row.provider,
  charges: row.charges || undefined,
  reference: row.reference,
  created: row.created,
  lastChecked: row.last_checked || undefined,
  completedAt: row.completed_at || undefined,
  customerId: row.customer_id,
  customerType: row.customer_type as "admin" | "member",
  paymentType: row.payment_type as "subscription" | "registration" | "contribution" | "loan_repayment" | "penalty",
  email: row.email || undefined,
  first_name: row.first_name || undefined,
  last_name: row.last_name || undefined,
});

const toPaymentRow = (payment: PaymentTransaction): PaymentTransactionRow => ({
  id: payment.id,
  charge_id: payment.chargeId,
  transaction_id: payment.transactionId || null,
  amount: payment.amount,
  phone: payment.phone,
  operator: payment.operator,
  status: payment.status,
  provider: payment.provider,
  charges: payment.charges || null,
  reference: payment.reference,
  created: payment.created,
  last_checked: payment.lastChecked || null,
  completed_at: payment.completedAt || null,
  customer_id: payment.customerId,
  customer_type: payment.customerType,
  payment_type: payment.paymentType,
  email: payment.email || null,
  first_name: payment.first_name || null,
  last_name: payment.last_name || null,
});

const toPaymentPatch = (patch: Partial<PaymentTransaction>): Partial<PaymentTransactionRow> => ({
  ...(patch.transactionId !== undefined ? { transaction_id: patch.transactionId || null } : {}),
  ...(patch.status !== undefined ? { status: patch.status } : {}),
  ...(patch.charges !== undefined ? { charges: patch.charges || null } : {}),
  ...(patch.lastChecked !== undefined ? { last_checked: patch.lastChecked || null } : {}),
  ...(patch.completedAt !== undefined ? { completed_at: patch.completedAt || null } : {}),
});

export const paymentRepository: PaymentRepository = {
  async create(payment) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("payment_transactions")
      .insert(toPaymentRow(payment))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromPaymentRow(data);
  },

  async getById(id) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromPaymentRow(data) : undefined;
  },

  async getByChargeId(chargeId) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("charge_id", chargeId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromPaymentRow(data) : undefined;
  },

  async listByCustomer(customerId, customerType) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("customer_id", customerId)
      .eq("customer_type", customerType)
      .order("created", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(fromPaymentRow);
  },

  async update(chargeId, patch) {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("payment_transactions")
      .update(toPaymentPatch(patch))
      .eq("charge_id", chargeId)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromPaymentRow(data) : undefined;
  },
};
