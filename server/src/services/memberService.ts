import type { MemberRepository, GroupRepository } from "../repositories/interfaces";
import type { Member } from "../models/types";
import { createId } from "../utils/id";
import { hashPassword, verifyPassword } from "../utils/password";
import { generateOtp } from "../utils/otp";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";
import { AuditService } from "./auditService";
import { NotificationService } from "./notificationService";
import { EmailService } from "./emailService";

export class MemberService {
  constructor(
    private memberRepository: MemberRepository,
    private groupRepository: GroupRepository,
    private auditService: AuditService,
    private notificationService: NotificationService,
    private emailService: EmailService
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
      twoFactorEnabled: false,
    };

    await this.memberRepository.create(member);

    await this.notificationService.create({
      groupId: params.groupId,
      type: "member_registration",
      message: `${member.fullName} requested to join the group`,
      adminId: undefined,
      memberId: member.id,
    });

    return { ...member, passwordHash: "" };
  }

  async createInvite(params: {
    groupId: string;
    fullName: string;
    username: string;
    email?: string;
    phone?: string;
  }) {
    if (!params.groupId || !params.fullName || !params.username) {
      throw new ApiError("Missing required fields");
    }

    if (!params.email && !params.phone) {
      throw new ApiError("Email or phone is required for invite", 400);
    }

    const otp = generateOtp(6);
    const inviteToken = createId("invite");
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const inviteOtpHash = await hashPassword(otp);

    const member: Member = {
      id: createId("member"),
      groupId: params.groupId,
      fullName: params.fullName,
      username: params.username,
      email: params.email,
      phone: params.phone,
      passwordHash: inviteOtpHash,
      status: "pending",
      createdAt: new Date().toISOString(),
      balance: 0,
      penaltiesTotal: 0,
      inviteToken,
      inviteOtpHash,
      inviteExpiresAt,
      inviteSentAt: new Date().toISOString(),
      twoFactorEnabled: false,
    };

    await this.memberRepository.create(member);

    const link = `${env.appBaseUrl}/member/activate?token=${inviteToken}`;

    await this.notificationService.create({
      groupId: params.groupId,
      type: "member_invite",
      message: `${member.fullName} was invited to join the group`,
      adminId: undefined,
      memberId: member.id,
    });

    // Send invitation email if email is provided
    if (params.email) {
      const group = await this.groupRepository.getById(params.groupId);
      const groupName = group?.name || "Your Group";
      
      // Send email asynchronously, don't block the response
      this.emailService.sendMemberInvite({
        to: params.email,
        memberName: params.fullName,
        groupName,
        otp,
        link,
        expiresAt: inviteExpiresAt,
      }).catch(error => {
        console.error("Failed to send invitation email:", error);
      });
    }

    return {
      member: { ...member, passwordHash: "", inviteOtpHash: "" },
      invite: { otp, link, expiresAt: inviteExpiresAt, token: inviteToken },
    };
  }

  async verifyInvite(token: string, otp: string) {
    const member = await this.memberRepository.findByInviteToken(token);
    if (!member) throw new ApiError("Invite not found", 404);
    if (!member.inviteExpiresAt) throw new ApiError("Invite expired", 400);

    const expiresAt = new Date(member.inviteExpiresAt).getTime();
    if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
      throw new ApiError("Invite expired", 400);
    }

    if (!member.inviteOtpHash) throw new ApiError("Invite invalid", 400);
    const ok = await verifyPassword(otp, member.inviteOtpHash);
    if (!ok) throw new ApiError("Invalid one-time password", 400);

    return { status: "ok", memberId: member.id };
  }

  async completeInvite(params: { token: string; otp: string; newPassword: string }) {
    const member = await this.memberRepository.findByInviteToken(params.token);
    if (!member) throw new ApiError("Invite not found", 404);
    if (!member.inviteExpiresAt) throw new ApiError("Invite expired", 400);

    const expiresAt = new Date(member.inviteExpiresAt).getTime();
    if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
      throw new ApiError("Invite expired", 400);
    }

    if (!member.inviteOtpHash) throw new ApiError("Invite invalid", 400);
    const ok = await verifyPassword(params.otp, member.inviteOtpHash);
    if (!ok) throw new ApiError("Invalid one-time password", 400);

    const passwordHash = await hashPassword(params.newPassword);
    const updated = await this.memberRepository.update(member.id, {
      passwordHash,
      status: "active",
      groupId: member.groupId,
      inviteToken: undefined,
      inviteOtpHash: undefined,
      inviteExpiresAt: undefined,
    });

    if (!updated) throw new ApiError("Failed to activate member", 500);

    await this.notificationService.create({
      groupId: member.groupId,
      memberId: member.id,
      type: "member_activated",
      message: "Your account has been activated",
    });

    return { status: "ok" };
  }

  async approve(memberId: string, actor: { id: string; groupId: string }) {
    const member = await this.memberRepository.getById(memberId);
    if (!member) throw new ApiError("Member not found", 404);
    if (member.groupId !== actor.groupId) throw new ApiError("Access denied", 403);

    const updated = await this.memberRepository.update(memberId, { status: "active" });
    if (!updated) throw new ApiError("Failed to update member");

    await this.auditService.log({
      groupId: actor.groupId,
      actorId: actor.id,
      actorRole: "group_admin",
      action: "member_approved",
      entityType: "member",
      entityId: memberId,
    });

    await this.notificationService.create({
      groupId: actor.groupId,
      memberId: memberId,
      type: "member_approved",
      message: "Your membership has been approved",
    });

    // Send approval email if email is provided
    if (member.email) {
      const group = await this.groupRepository.getById(actor.groupId);
      const groupName = group?.name || "Your Group";
      const loginUrl = `${env.appBaseUrl}/login`;
      
      // Send email asynchronously, don't block the response
      this.emailService.sendMemberApproval({
        to: member.email,
        memberName: member.fullName,
        groupName,
        loginUrl,
      }).catch(error => {
        console.error("Failed to send approval email:", error);
      });
    }

    return { ...updated, passwordHash: "" };
  }

  async reject(memberId: string, actor: { id: string; groupId: string }) {
    const member = await this.memberRepository.getById(memberId);
    if (!member) throw new ApiError("Member not found", 404);
    if (member.groupId !== actor.groupId) throw new ApiError("Access denied", 403);

    const updated = await this.memberRepository.update(memberId, { status: "rejected" });
    if (!updated) throw new ApiError("Failed to update member");

    await this.auditService.log({
      groupId: actor.groupId,
      actorId: actor.id,
      actorRole: "group_admin",
      action: "member_rejected",
      entityType: "member",
      entityId: memberId,
    });

    return { ...updated, passwordHash: "" };
  }

  async listByGroup(groupId: string) {
    // Automatically clean up pending members older than 24 hours
    await this.cleanupOldPendingMembers(groupId);
    
    const members = await this.memberRepository.listByGroup(groupId);
    return members.map((member) => ({
      ...member,
      passwordHash: "",
    }));
  }

  /**
   * Automatically delete pending members that have been waiting for more than 24 hours
   * This keeps the member list clean and removes stale pending registrations
   */
  private async cleanupOldPendingMembers(groupId: string) {
    const members = await this.memberRepository.listByGroup(groupId);
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const member of members) {
      if (member.status === "pending") {
        const createdAt = new Date(member.createdAt);
        if (createdAt < twentyFourHoursAgo) {
          // Delete the member
          await this.memberRepository.delete(member.id);
          
          // Log the cleanup action
          await this.auditService.log({
            groupId,
            actorId: "system",
            actorRole: "group_admin",
            action: "member_auto_deleted",
            entityType: "member",
            entityId: member.id,
            meta: {
              reason: "Pending for more than 24 hours",
              createdAt: member.createdAt,
            },
          });
        }
      }
    }
  }

  async getById(memberId: string) {
    const member = await this.memberRepository.getById(memberId);
    if (!member) throw new ApiError("Member not found", 404);
    return { ...member, passwordHash: "" };
  }

  async updateProfile(memberId: string, patch: { fullName?: string; email?: string; phone?: string; username?: string }) {
    const updated = await this.memberRepository.update(memberId, patch);
    if (!updated) throw new ApiError("Member not found", 404);
    return { ...updated, passwordHash: "" };
  }

  async changePassword(memberId: string, currentPassword: string, newPassword: string) {
    const member = await this.memberRepository.getById(memberId);
    if (!member) throw new ApiError("Member not found", 404);

    const ok = await verifyPassword(currentPassword, member.passwordHash);
    if (!ok) throw new ApiError("Current password is incorrect", 400);

    const passwordHash = await hashPassword(newPassword);
    const updated = await this.memberRepository.update(memberId, { passwordHash });
    if (!updated) throw new ApiError("Failed to update password", 500);
    return { status: "ok" };
  }
}
