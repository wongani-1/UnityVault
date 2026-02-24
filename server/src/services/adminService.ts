import type { AdminRepository, MemberRepository } from "../repositories/interfaces";
import type { PaymentRepository } from "../repositories/interfaces/paymentRepository";
import { ApiError } from "../utils/apiError";
import { hashPassword, verifyPassword } from "../utils/password";
import { createId } from "../utils/id";
import {
  getSubscriptionPlan,
  type SubscriptionPlan,
  type SubscriptionPlanId,
} from "../config/subscriptionPlans";

export class AdminService {
  constructor(
    private adminRepository: AdminRepository,
    private memberRepository: MemberRepository,
    private paymentRepository: PaymentRepository
  ) {}

  private resolvePlanFromPaymentReference(reference?: string): SubscriptionPlan | undefined {
    if (!reference?.startsWith("subscription:")) return undefined;
    const planId = reference.replace("subscription:", "") as SubscriptionPlanId;
    return getSubscriptionPlan(planId);
  }

  private resolvePlanFromAmount(amount: number): SubscriptionPlan | undefined {
    if (amount === 15000) return getSubscriptionPlan("starter");
    if (amount === 45000) return getSubscriptionPlan("professional");
    return undefined;
  }

  private async getLatestSubscriptionPlan(adminId: string): Promise<SubscriptionPlan | undefined> {
    const payments = await this.paymentRepository.listByCustomer(adminId, "admin");
    const latestSubscriptionPayment = payments.find(
      (payment) => payment.paymentType === "subscription" && payment.status === "success"
    );

    if (!latestSubscriptionPayment) return undefined;

    return (
      this.resolvePlanFromPaymentReference(latestSubscriptionPayment.reference) ||
      this.resolvePlanFromAmount(latestSubscriptionPayment.amount)
    );
  }

  async getById(adminId: string) {
    const admin = await this.adminRepository.getById(adminId);
    if (!admin) throw new ApiError("Admin not found", 404);
    return { ...admin, passwordHash: "" };
  }

  async listByGroup(groupId: string) {
    const admins = await this.adminRepository.listByGroup(groupId);
    return admins.map(admin => ({ ...admin, passwordHash: "" }));
  }

  async updateProfile(adminId: string, patch: { first_name?: string; last_name?: string; email?: string; phone?: string; username?: string }) {
    const updated = await this.adminRepository.update(adminId, patch);
    if (!updated) throw new ApiError("Admin not found", 404);
    return { ...updated, passwordHash: "" };
  }

  async changePassword(adminId: string, currentPassword: string, newPassword: string) {
    const admin = await this.adminRepository.getById(adminId);
    if (!admin) throw new ApiError("Admin not found", 404);

    const ok = await verifyPassword(currentPassword, admin.passwordHash);
    if (!ok) throw new ApiError("Current password is incorrect", 400);

    const passwordHash = await hashPassword(newPassword);
    const updated = await this.adminRepository.update(adminId, { passwordHash });
    if (!updated) throw new ApiError("Failed to update password", 500);
    return { status: "ok" };
  }

  async recordSubscriptionPayment(adminId: string, planId: SubscriptionPlanId = "starter") {
    const admin = await this.adminRepository.getById(adminId);
    if (!admin) throw new ApiError("Admin not found", 404);

    const selectedPlan = getSubscriptionPlan(planId);
    if (!selectedPlan) {
      throw new ApiError("Invalid subscription plan selected", 400);
    }

    if (selectedPlan.id === "enterprise" || selectedPlan.monthlyPrice === null) {
      throw new ApiError(
        "Enterprise plan uses custom pricing. Please contact support to activate it.",
        400
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await this.paymentRepository.create({
      id: createId("payment"),
      chargeId: createId("charge"),
      transactionId: `MANUAL_${Date.now()}`,
      amount: selectedPlan.monthlyPrice,
      phone: admin.phone || "N/A",
      operator: "airtel",
      status: "success",
      provider: "manual",
      charges: 0,
      reference: `subscription:${selectedPlan.id}`,
      created: now.toISOString(),
      completedAt: now.toISOString(),
      customerId: admin.id,
      customerType: "admin",
      paymentType: "subscription",
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
    });

    const updated = await this.adminRepository.update(adminId, {
      subscriptionPaid: true,
      subscriptionPaidAt: now.toISOString(),
      subscriptionExpiresAt: expiresAt.toISOString(),
    });
    
    if (!updated) throw new ApiError("Failed to record payment", 500);
    return { ...updated, passwordHash: "" };
  }

  async isSubscriptionActive(adminId: string): Promise<boolean> {
    const admin = await this.adminRepository.getById(adminId);
    if (!admin) return false;
    
    if (!admin.subscriptionPaid || !admin.subscriptionExpiresAt) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(admin.subscriptionExpiresAt);
    return now < expiresAt;
  }

  async getSubscriptionStatus(adminId: string) {
    const admin = await this.adminRepository.getById(adminId);
    if (!admin) throw new ApiError("Admin not found", 404);

    const isActive = await this.isSubscriptionActive(adminId);
    const latestPlan = await this.getLatestSubscriptionPlan(adminId);
    const effectivePlan = latestPlan || getSubscriptionPlan("starter");

    const members = await this.memberRepository.listByGroup(admin.groupId);
    const memberCount = members.length;
    const memberLimit = effectivePlan?.memberLimit ?? null;
    const canAddMembers = isActive && (memberLimit === null || memberCount < memberLimit);

    return {
      subscriptionPaid: admin.subscriptionPaid,
      subscriptionPaidAt: admin.subscriptionPaidAt,
      subscriptionExpiresAt: admin.subscriptionExpiresAt,
      isActive,
      planId: effectivePlan?.id || "starter",
      planName: effectivePlan?.name || "Starter",
      memberLimit,
      memberCount,
      canAddMembers,
      manageMultipleGroups: effectivePlan?.manageMultipleGroups || false,
    };
  }

  async assertCanManageMembers(params: { adminId: string; groupId: string }) {
    const admin = await this.adminRepository.getById(params.adminId);
    if (!admin) throw new ApiError("Admin not found", 404);
    if (admin.groupId !== params.groupId) throw new ApiError("Access denied", 403);

    const subscription = await this.getSubscriptionStatus(params.adminId);
    if (!subscription.isActive) {
      throw new ApiError(
        "Subscription required. Please pay or renew your subscription to add members.",
        400
      );
    }

    if (subscription.memberLimit !== null && subscription.memberCount >= subscription.memberLimit) {
      throw new ApiError(
        `Your ${subscription.planName} plan allows up to ${subscription.memberLimit} members. Upgrade your plan to add more members.`,
        400
      );
    }
  }
}