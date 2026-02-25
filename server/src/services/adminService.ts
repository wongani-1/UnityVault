import type {
  AdminRepository,
  MemberRepository,
  NotificationRepository,
} from "../repositories/interfaces";
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
  private static readonly STARTER_TRIAL_DAYS = 14;
  private static readonly TRIAL_WARNING_DAYS_BEFORE_END = 2;
  private static readonly PLAN_RANK: Record<SubscriptionPlanId, number> = {
    starter: 1,
    professional: 2,
    enterprise: 3,
  };

  constructor(
    private adminRepository: AdminRepository,
    private memberRepository: MemberRepository,
    private paymentRepository: PaymentRepository,
    private notificationRepository: NotificationRepository
  ) {}

  private getStarterTrialEnd(createdAt?: string): string | undefined {
    if (!createdAt) return undefined;
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return undefined;
    return new Date(
      created.getTime() + AdminService.STARTER_TRIAL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();
  }

  private getTrialDaysRemaining(trialEndsAt?: string): number {
    if (!trialEndsAt) return 0;
    const endsAt = new Date(trialEndsAt);
    if (Number.isNaN(endsAt.getTime())) return 0;
    const remainingMs = endsAt.getTime() - Date.now();
    if (remainingMs <= 0) return 0;
    return Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  }

  private async ensureTrialEndingSoonNotification(params: {
    adminId: string;
    groupId: string;
    trialEndsAt: string;
    trialDaysRemaining: number;
  }) {
    if (params.trialDaysRemaining !== AdminService.TRIAL_WARNING_DAYS_BEFORE_END) {
      return;
    }

    const existing = await this.notificationRepository.listByGroup(params.groupId);
    const alreadySent = existing.some(
      (item) =>
        item.type === "trial_ending_soon" &&
        item.adminId === params.adminId &&
        item.message.includes(params.trialEndsAt.slice(0, 10))
    );

    if (alreadySent) {
      return;
    }

    await this.notificationRepository.create({
      id: createId("note"),
      groupId: params.groupId,
      adminId: params.adminId,
      type: "trial_ending_soon",
      message:
        "Your 14-day Starter trial ends in 2 days. Please subscribe before " +
        new Date(params.trialEndsAt).toLocaleDateString() +
        " to keep access to all system features.",
      status: "pending",
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

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

  private isHigherPlan(currentPlanId: SubscriptionPlanId, requestedPlanId: SubscriptionPlanId) {
    return (
      AdminService.PLAN_RANK[requestedPlanId] > AdminService.PLAN_RANK[currentPlanId]
    );
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

    const latestPlan = await this.getLatestSubscriptionPlan(adminId);
    const currentPlan = latestPlan || getSubscriptionPlan("starter");

    if (!currentPlan) {
      throw new ApiError("Unable to determine current subscription plan", 500);
    }

    const isUpgrade = this.isHigherPlan(currentPlan.id, selectedPlan.id);
    const isSamePlan = currentPlan.id === selectedPlan.id;

    if (!isUpgrade && !isSamePlan) {
      throw new ApiError(
        `Downgrade is not allowed. Your current plan is ${currentPlan.name}. Choose a higher plan to upgrade.`,
        400
      );
    }

    if (selectedPlan.id === "enterprise" || selectedPlan.monthlyPrice === null) {
      if (!isUpgrade) {
        throw new ApiError("You are already on the highest available plan.", 400);
      }

      const existing = await this.notificationRepository.listByGroup(admin.groupId);
      const pendingEnterpriseRequest = existing.some(
        (item) =>
          item.type === "subscription_upgrade_request" &&
          item.adminId === admin.id &&
          item.message.toLowerCase().includes("enterprise")
      );

      if (!pendingEnterpriseRequest) {
        await this.notificationRepository.create({
          id: createId("note"),
          groupId: admin.groupId,
          adminId: admin.id,
          type: "subscription_upgrade_request",
          message:
            `Upgrade request submitted: ${currentPlan.name} → Enterprise. Our team will contact you for custom pricing and activation.`,
          status: "pending",
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      return {
        ...admin,
        passwordHash: "",
        upgradeRequested: true,
        requestedPlanId: "enterprise",
        message:
          "Enterprise upgrade request submitted successfully. Our team will contact you for custom pricing and activation.",
      };
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

    const latestPlan = await this.getLatestSubscriptionPlan(adminId);
    const now = new Date();
    const hasPaidSubscriptionWindow =
      admin.subscriptionPaid &&
      Boolean(admin.subscriptionExpiresAt) &&
      now < new Date(admin.subscriptionExpiresAt as string);

    const isStarterTrialEligible = !admin.subscriptionPaid && !latestPlan;
    const trialEndsAt = isStarterTrialEligible ? this.getStarterTrialEnd(admin.createdAt) : undefined;
    const isStarterTrialActive = isStarterTrialEligible && Boolean(trialEndsAt) && now < new Date(trialEndsAt as string);

    return hasPaidSubscriptionWindow || isStarterTrialActive;
  }

  async getSubscriptionStatus(adminId: string) {
    const admin = await this.adminRepository.getById(adminId);
    if (!admin) throw new ApiError("Admin not found", 404);

    const latestPlan = await this.getLatestSubscriptionPlan(adminId);
    const effectivePlan = latestPlan || getSubscriptionPlan("starter");

    const now = new Date();
    const paidSubscriptionActive =
      admin.subscriptionPaid &&
      Boolean(admin.subscriptionExpiresAt) &&
      now < new Date(admin.subscriptionExpiresAt as string);

    const isStarterTrialEligible = !admin.subscriptionPaid && !latestPlan;
    const trialEndsAt = isStarterTrialEligible ? this.getStarterTrialEnd(admin.createdAt) : undefined;
    const isTrialActive =
      Boolean(isStarterTrialEligible && trialEndsAt) && now < new Date(trialEndsAt as string);
    const trialDaysRemaining = isTrialActive ? this.getTrialDaysRemaining(trialEndsAt) : 0;
    const isActive = paidSubscriptionActive || isTrialActive;

    if (isTrialActive && trialEndsAt) {
      await this.ensureTrialEndingSoonNotification({
        adminId: admin.id,
        groupId: admin.groupId,
        trialEndsAt,
        trialDaysRemaining,
      });
    }

    const members = await this.memberRepository.listByGroup(admin.groupId);
    const memberCount = members.length;
    const memberLimit = effectivePlan?.memberLimit ?? null;
    const canAddMembers = isActive && (memberLimit === null || memberCount < memberLimit);
    const availableUpgradePlanIds = (Object.keys(AdminService.PLAN_RANK) as SubscriptionPlanId[])
      .filter((planId) => this.isHigherPlan(effectivePlan?.id || "starter", planId));

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
      isTrialActive,
      trialEndsAt,
      trialDaysRemaining,
      trialDurationDays: AdminService.STARTER_TRIAL_DAYS,
      currentPlanId: effectivePlan?.id || "starter",
      availableUpgradePlanIds,
    };
  }

  async assertCanManageMembers(params: { adminId: string; groupId: string }) {
    const admin = await this.adminRepository.getById(params.adminId);
    if (!admin) throw new ApiError("Admin not found", 404);
    if (admin.groupId !== params.groupId) throw new ApiError("Access denied", 403);

    const subscription = await this.getSubscriptionStatus(params.adminId);
    if (!subscription.isActive) {
      if (!subscription.subscriptionPaid && subscription.planId === "starter" && subscription.trialEndsAt) {
        throw new ApiError(
          "Your 14-day Starter trial has ended. Please choose a paid subscription plan to continue adding members.",
          400
        );
      }

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