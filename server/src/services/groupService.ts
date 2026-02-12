import type {
  GroupRepository,
  AdminRepository,
} from "../repositories/interfaces";
import type { Admin, Group, GroupSettings } from "../models/types";
import { createId } from "../utils/id";
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
    admin: { email: string; username: string; password: string };
  }) {
    if (!params.name) throw new ApiError("Group name is required");
    if (!params.admin.email || !params.admin.username || !params.admin.password) {
      throw new ApiError("Admin credentials are required");
    }

    const group: Group = {
      id: createId("group"),
      name: params.name,
      settings: params.settings,
      createdAt: new Date().toISOString(),
    };

    const admin: Admin = {
      id: createId("admin"),
      groupId: group.id,
      email: params.admin.email,
      username: params.admin.username,
      passwordHash: await hashPassword(params.admin.password),
      role: "group_admin",
      createdAt: new Date().toISOString(),
    };

    this.groupRepository.create(group);
    this.adminRepository.create(admin);

    this.auditService.log({
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

  getGroup(groupId: string) {
    const group = this.groupRepository.getById(groupId);
    if (!group) throw new ApiError("Group not found", 404);
    return group;
  }

  updateSettings(groupId: string, settings: GroupSettings) {
    if (
      settings.contributionAmount < 0 ||
      settings.loanInterestRate < 0 ||
      settings.penaltyRate < 0 ||
      settings.compulsoryInterestRate < 0
    ) {
      throw new ApiError("Settings values must be non-negative", 400);
    }

    const updated = this.groupRepository.update(groupId, { settings });
    if (!updated) throw new ApiError("Group not found", 404);
    return updated;
  }
}
