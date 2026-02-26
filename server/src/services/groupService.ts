import type {
  GroupRepository,
  AdminRepository,
} from "../repositories/interfaces";
import type { SubscriptionPlanId } from "../config/subscriptionPlans";
import type { DistributionRepository } from "../repositories/interfaces/distributionRepository";
import type { Admin, Group, GroupSettings } from "../models/types";
import { createGroupId, createId } from "../utils/id";
import {
  hashPassword,
  isStrongPassword,
  STRONG_PASSWORD_ERROR_MESSAGE,
} from "../utils/password";
import {
  isValidEmail,
  isValidPhone,
  normalizePhone,
} from "../utils/contactValidation";
import { ApiError } from "../utils/apiError";
import { AuditService } from "./auditService";

export class GroupService {
  constructor(
    private groupRepository: GroupRepository,
    private adminRepository: AdminRepository,
    private auditService: AuditService,
    private distributionRepository: DistributionRepository
  ) {}

  private async ensureCycleOpen(groupId: string, at = new Date()) {
    const year = at.getFullYear();
    const distribution = await this.distributionRepository.getByGroupAndYear(groupId, year);
    if (distribution?.status === "completed") {
      throw new ApiError(
        `Cycle ${year} is closed. Group settings cannot be changed until the next cycle starts.`,
        400
      );
    }
  }

  async createGroup(params: {
    name: string;
    settings: GroupSettings;
    planId: SubscriptionPlanId;
    admin: { email: string; password: string; first_name?: string; last_name?: string; phone?: string };
  }) {
    if (!params.name) throw new ApiError("Group name is required");
    if (!params.admin.email || !params.admin.password) {
      throw new ApiError("Admin credentials are required");
    }

    if (!isStrongPassword(params.admin.password)) {
      throw new ApiError(STRONG_PASSWORD_ERROR_MESSAGE, 400);
    }

    const normalizedEmail = params.admin.email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      throw new ApiError("Please provide a valid email address", 400);
    }

    const normalizedPhone = params.admin.phone ? normalizePhone(params.admin.phone) : undefined;
    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      throw new ApiError("Please provide a valid phone number", 400);
    }

    const existingAdmin = await this.adminRepository.findByEmail(normalizedEmail);
    if (existingAdmin) {
      throw new ApiError("This email is already used to create a group", 409);
    }

    const group: Group = {
      id: createGroupId(),
      name: params.name,
      settings: params.settings,
      createdAt: new Date().toISOString(),
      totalSavings: 0,
      totalIncome: 0,
      cash: 0,
    };

    const admin: Admin = {
      id: createId("admin"),
      groupId: group.id,
      first_name: params.admin.first_name,
      last_name: params.admin.last_name,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash: await hashPassword(params.admin.password),
      role: "group_admin",
      createdAt: new Date().toISOString(),
      twoFactorEnabled: false,
      subscriptionPaid: false,
      currentPlanId: params.planId,
    };

    await this.groupRepository.create(group);
    await this.adminRepository.create(admin);

    await this.auditService.log({
      groupId: group.id,
      actorId: admin.id,
      actorRole: "group_admin",
      action: "group_created",
      entityType: "group",
      entityId: group.id,
    });

    return {
      group,
      admin: { ...admin, passwordHash: "" },
    };
  }

  async getGroup(groupId: string) {
    const group = await this.groupRepository.getById(groupId);
    if (!group) throw new ApiError("Group not found", 404);
    return group;
  }

  async updateSettings(groupId: string, settings: GroupSettings) {
    await this.ensureCycleOpen(groupId);

    if (
      settings.contributionAmount < 0 ||
      settings.shareFee < 0 ||
      settings.initialLoanAmount < 0 ||
      settings.seedAmount < 0 ||
      settings.loanInterestRate < 0 ||
      settings.penaltyRate < 0 ||
      settings.contributionPenaltyRate < 0 ||
      settings.compulsoryInterestRate < 0
    ) {
      throw new ApiError("Settings values must be non-negative", 400);
    }

    const updated = await this.groupRepository.update(groupId, { settings });
    if (!updated) throw new ApiError("Group not found", 404);
    return updated;
  }
}
