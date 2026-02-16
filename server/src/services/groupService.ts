import type {
  GroupRepository,
  AdminRepository,
} from "../repositories/interfaces";
import type { Admin, Group, GroupSettings } from "../models/types";
import { createGroupId, createId } from "../utils/id";
import { hashPassword } from "../utils/password";
import { ApiError } from "../utils/apiError";
import { AuditService } from "./auditService";

export class GroupService {
  constructor(
    private groupRepository: GroupRepository,
    private adminRepository: AdminRepository,
    private auditService: AuditService
  ) {}

  async createGroup(params: {
    name: string;
    settings: GroupSettings;
    admin: { email: string; username: string; password: string; fullName?: string; phone?: string };
  }) {
    if (!params.name) throw new ApiError("Group name is required");
    if (!params.admin.email || !params.admin.username || !params.admin.password) {
      throw new ApiError("Admin credentials are required");
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
      fullName: params.admin.fullName,
      email: params.admin.email,
      phone: params.admin.phone,
      username: params.admin.username,
      passwordHash: await hashPassword(params.admin.password),
      role: "group_admin",
      createdAt: new Date().toISOString(),
      twoFactorEnabled: false,
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
    if (
      settings.contributionAmount < 0 ||
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
