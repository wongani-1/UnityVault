import type { MemberRepository } from "../repositories/interfaces";
import type { Member } from "../models/types";
import { createId } from "../utils/id";
import { hashPassword, verifyPassword } from "../utils/password";
import { ApiError } from "../utils/apiError";
import { AuditService } from "./auditService";
import { NotificationService } from "./notificationService";

export class MemberService {
  constructor(
    private memberRepository: MemberRepository,
    private auditService: AuditService,
    private notificationService: NotificationService
  ) {}

  async register(params: {
    groupId: string;
    fullName: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
  }) {
    if (!params.groupId || !params.fullName || !params.username || !params.password) {
      throw new ApiError("Missing required fields");
    }

    const member: Member = {
      id: createId("member"),
      groupId: params.groupId,
      fullName: params.fullName,
      username: params.username,
      email: params.email,
      phone: params.phone,
      passwordHash: await hashPassword(params.password),
      status: "pending",
      createdAt: new Date().toISOString(),
      balance: 0,
      penaltiesTotal: 0,
    };

    this.memberRepository.create(member);

    this.notificationService.create({
      groupId: params.groupId,
      type: "member_registration",
      message: `${member.fullName} requested to join the group`,
      adminId: undefined,
      memberId: member.id,
    });

    return { ...member, passwordHash: "" };
  }

  approve(memberId: string, actor: { id: string; groupId: string }) {
    const member = this.memberRepository.getById(memberId);
    if (!member) throw new ApiError("Member not found", 404);
    if (member.groupId !== actor.groupId) throw new ApiError("Access denied", 403);

    const updated = this.memberRepository.update(memberId, { status: "active" });
    if (!updated) throw new ApiError("Failed to update member");

    this.auditService.log({
      groupId: actor.groupId,
      actorId: actor.id,
      actorRole: "group_admin",
      action: "member_approved",
      entityType: "member",
      entityId: memberId,
    });

    this.notificationService.create({
      groupId: actor.groupId,
      memberId: memberId,
      type: "member_approved",
      message: "Your membership has been approved",
    });

    return { ...updated, passwordHash: "" };
  }

  reject(memberId: string, actor: { id: string; groupId: string }) {
    const member = this.memberRepository.getById(memberId);
    if (!member) throw new ApiError("Member not found", 404);
    if (member.groupId !== actor.groupId) throw new ApiError("Access denied", 403);

    const updated = this.memberRepository.update(memberId, { status: "rejected" });
    if (!updated) throw new ApiError("Failed to update member");

    this.auditService.log({
      groupId: actor.groupId,
      actorId: actor.id,
      actorRole: "group_admin",
      action: "member_rejected",
      entityType: "member",
      entityId: memberId,
    });

    return { ...updated, passwordHash: "" };
  }

  listByGroup(groupId: string) {
    return this.memberRepository.listByGroup(groupId).map((member) => ({
      ...member,
      passwordHash: "",
    }));
  }

  getById(memberId: string) {
    const member = this.memberRepository.getById(memberId);
    if (!member) throw new ApiError("Member not found", 404);
    return { ...member, passwordHash: "" };
  }

  updateProfile(memberId: string, patch: { fullName?: string; email?: string; phone?: string; username?: string }) {
    const updated = this.memberRepository.update(memberId, patch);
    if (!updated) throw new ApiError("Member not found", 404);
    return { ...updated, passwordHash: "" };
  }

  async changePassword(memberId: string, currentPassword: string, newPassword: string) {
    const member = this.memberRepository.getById(memberId);
    if (!member) throw new ApiError("Member not found", 404);

    const ok = await verifyPassword(currentPassword, member.passwordHash);
    if (!ok) throw new ApiError("Current password is incorrect", 400);

    const passwordHash = await hashPassword(newPassword);
    const updated = this.memberRepository.update(memberId, { passwordHash });
    if (!updated) throw new ApiError("Failed to update password", 500);
    return { status: "ok" };
  }
}
