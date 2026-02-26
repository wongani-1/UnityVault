import type { MemberRepository, GroupRepository } from "../repositories/interfaces";
import type { DistributionRepository } from "../repositories/interfaces/distributionRepository";
import type { Member, Transaction } from "../models/types";
import type { TransactionRepository } from "../repositories/interfaces";
import { createId } from "../utils/id";
import {
  hashPassword,
  isStrongPassword,
  STRONG_PASSWORD_ERROR_MESSAGE,
  verifyPassword,
} from "../utils/password";
import {
  isValidEmail,
  isValidPhone,
  normalizePhone,
} from "../utils/contactValidation";
import { generateOtp } from "../utils/otp";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";
import { AuditService } from "./auditService";
import { NotificationService } from "./notificationService";
import { EmailService } from "./emailService";

export class MemberService {
  private static readonly INVITE_EXPIRY_HOURS = 24;

  constructor(
    private memberRepository: MemberRepository,
    private groupRepository: GroupRepository,
    private auditService: AuditService,
    private notificationService: NotificationService,
    private emailService: EmailService,
    private distributionRepository: DistributionRepository,
    private transactionRepository: TransactionRepository
  ) {}

  private async ensureCycleOpen(groupId: string, at = new Date()) {
    const year = at.getFullYear();
    const distribution = await this.distributionRepository.getByGroupAndYear(groupId, year);
    if (distribution?.status === "completed") {
      throw new ApiError(
        `Cycle ${year} is closed. New members cannot be added until the next cycle starts.`,
        400
      );
    }
  }

  private normalizeOptional(value?: string) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeEmail(value?: string) {
    const normalized = this.normalizeOptional(value);
    return normalized ? normalized.toLowerCase() : undefined;
  }

  private normalizePhone(value?: string) {
    const normalized = this.normalizeOptional(value);
    return normalized ? normalizePhone(normalized) : undefined;
  }

  private async assertUniqueCredentialsInGroup(params: {
    groupId: string;
    email?: string;
    phone?: string;
    excludeMemberId?: string;
  }) {
    const members = await this.memberRepository.listByGroup(params.groupId);

    const email = this.normalizeEmail(params.email);
    const phone = this.normalizePhone(params.phone);

    const duplicate = members.find((member) => {
      if (params.excludeMemberId && member.id === params.excludeMemberId) {
        return false;
      }

      const memberEmail = this.normalizeEmail(member.email);
      const memberPhone = this.normalizePhone(member.phone);

      return (
        (email && memberEmail === email) ||
        (phone && memberPhone === phone)
      );
    });

    if (!duplicate) return;

    const duplicateEmail = email && this.normalizeEmail(duplicate.email) === email;
    const duplicatePhone = phone && this.normalizePhone(duplicate.phone) === phone;

    if (duplicateEmail) {
      throw new ApiError("A member with this email already exists in this group", 409);
    }
    if (duplicatePhone) {
      throw new ApiError("A member with this phone number already exists in this group", 409);
    }
  }

  async register(params: {
    groupId: string;
    first_name: string;
    last_name: string;
    password: string;
    email?: string;
    phone?: string;
  }) {
    const normalizedEmail = this.normalizeOptional(params.email);
    const normalizedPhone = this.normalizeOptional(params.phone);

    if (!params.groupId || !params.first_name || !params.last_name || !params.password) {
      throw new ApiError("Missing required fields");
    }

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      throw new ApiError("Please provide a valid email address", 400);
    }

    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      throw new ApiError("Please provide a valid phone number", 400);
    }

    if (!isStrongPassword(params.password)) {
      throw new ApiError(STRONG_PASSWORD_ERROR_MESSAGE, 400);
    }

    await this.assertUniqueCredentialsInGroup({
      groupId: params.groupId,
      email: normalizedEmail,
      phone: normalizedPhone,
    });

    const member: Member = {
      id: createId("member"),
      groupId: params.groupId,
      first_name: params.first_name,
      last_name: params.last_name,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash: await hashPassword(params.password),
      status: "pending",
      createdAt: new Date().toISOString(),
      balance: 0,
      penaltiesTotal: 0,
      twoFactorEnabled: false,
      registrationFeePaid: false,
      registrationFeePaidAt: undefined,
      seedPaid: false,
      seedPaidAt: undefined,
      sharesOwned: 0,
    };

    await this.memberRepository.create(member);

    await this.notificationService.create({
      groupId: params.groupId,
      type: "member_registration",
      message: `${member.first_name} ${member.last_name} requested to join the group`,
      adminId: undefined,
      memberId: member.id,
    });

    return { ...member, passwordHash: "" };
  }

  async createInvite(params: {
    adminId: string;
    groupId: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  }) {
    console.log("Creating member invite request");
    await this.ensureCycleOpen(params.groupId);

    const normalizedEmail = this.normalizeOptional(params.email);
    const normalizedPhone = this.normalizeOptional(params.phone);

    if (!params.groupId || !params.first_name || !params.last_name) {
      throw new ApiError("Missing required fields");
    }

    if (!normalizedEmail && !normalizedPhone) {
      throw new ApiError("Email or phone is required for invite", 400);
    }

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      throw new ApiError("Please provide a valid email address", 400);
    }

    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      throw new ApiError("Please provide a valid phone number", 400);
    }

    await this.assertUniqueCredentialsInGroup({
      groupId: params.groupId,
      email: normalizedEmail,
      phone: normalizedPhone,
    });

    const otp = generateOtp(6);
    const inviteToken = createId("invite");
    const inviteExpiresAt = new Date(
      Date.now() + MemberService.INVITE_EXPIRY_HOURS * 60 * 60 * 1000
    ).toISOString();
    const inviteOtpHash = await hashPassword(otp);

    const member: Member = {
      id: createId("member"),
      groupId: params.groupId,
      first_name: params.first_name,
      last_name: params.last_name,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash: inviteOtpHash,
      status: "pending",
      createdAt: new Date().toISOString(),
      balance: 0,
      penaltiesTotal: 0,
      registrationFeePaid: false,
      registrationFeePaidAt: undefined,
      seedPaid: false,
      seedPaidAt: undefined,
      sharesOwned: 0,
      inviteToken,
      inviteOtpHash,
      inviteExpiresAt,
      inviteSentAt: new Date().toISOString(),
      twoFactorEnabled: false,
    };

    await this.memberRepository.create(member);

    const link = `${env.appBaseUrl}/member/activate?token=${inviteToken}`;

    let emailAttempted = false;
    let emailSent = false;
    let emailError: string | undefined;

    await this.notificationService.create({
      groupId: params.groupId,
      type: "member_invite",
      message: `${member.first_name} ${member.last_name} was invited to join the group`,
      adminId: undefined,
      memberId: member.id,
    });

    // Send invitation email if email is provided
    if (normalizedEmail) {
      emailAttempted = true;
      const group = await this.groupRepository.getById(params.groupId);
      const groupName = group?.name || "Your Group";
      console.log("Sending member invite email");

      try {
        emailSent = await this.emailService.sendMemberInvite({
          to: normalizedEmail,
          memberName: `${params.first_name} ${params.last_name}`,
          groupName,
          otp,
          link,
          expiresAt: inviteExpiresAt,
        });

        if (!emailSent) {
          emailError = "Email provider did not accept the message. Check server email configuration and logs.";
        }
      } catch (error) {
        emailSent = false;
        emailError = error instanceof Error ? error.message : "Unknown email delivery failure";
        console.error("Failed to send invitation email:", error);
      }
    } else {
      console.log("Skipping invite email because no recipient email was provided");
    }

    return {
      member: { ...member, passwordHash: "", inviteOtpHash: "" },
      invite: { otp, link, expiresAt: inviteExpiresAt, token: inviteToken },
      emailDelivery: {
        attempted: emailAttempted,
        sent: emailSent,
        error: emailError,
      },
    };
  }

  async verifyInvite(token: string, otp: string) {
    const member = await this.memberRepository.findByInviteToken(token);
    if (!member) throw new ApiError("Invite not found", 404);
    if (!member.inviteExpiresAt) {
      throw new ApiError("Activation link and OTP have expired", 400);
    }

    const expiresAt = new Date(member.inviteExpiresAt).getTime();
    if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
      throw new ApiError("Activation link and OTP have expired", 400);
    }

    if (!member.inviteOtpHash) throw new ApiError("Invite invalid", 400);
    const ok = await verifyPassword(otp, member.inviteOtpHash);
    if (!ok) throw new ApiError("Invalid one-time password", 400);

    return { status: "ok", memberId: member.id };
  }

  async completeInvite(params: { token: string; otp: string; newPassword: string }) {
    const member = await this.memberRepository.findByInviteToken(params.token);
    if (!member) throw new ApiError("Invite not found", 404);
    if (!member.inviteExpiresAt) {
      throw new ApiError("Activation link and OTP have expired", 400);
    }

    const expiresAt = new Date(member.inviteExpiresAt).getTime();
    if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
      throw new ApiError("Activation link and OTP have expired", 400);
    }

    if (!member.inviteOtpHash) throw new ApiError("Invite invalid", 400);
    const ok = await verifyPassword(params.otp, member.inviteOtpHash);
    if (!ok) throw new ApiError("Invalid one-time password", 400);

    if (!isStrongPassword(params.newPassword)) {
      throw new ApiError(STRONG_PASSWORD_ERROR_MESSAGE, 400);
    }

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

  async listByGroup(groupId: string) {
    // Automatically clean up pending members older than 24 hours
    await this.cleanupOldPendingMembers(groupId);
    
    const members = await this.memberRepository.listByGroup(groupId);
    return members.map((member) => ({
      ...member,
      passwordHash: "",
    }));
  }

  async listDuplicateCredentials(groupId: string) {
    const members = await this.memberRepository.listByGroup(groupId);

    const emailMap = new Map<string, Member[]>();
    const phoneMap = new Map<string, Member[]>();

    const addToMap = (map: Map<string, Member[]>, key: string | undefined, member: Member) => {
      if (!key) return;
      const current = map.get(key) || [];
      current.push(member);
      map.set(key, current);
    };

    members.forEach((member) => {
      addToMap(emailMap, this.normalizeEmail(member.email), member);
      addToMap(phoneMap, this.normalizePhone(member.phone), member);
    });

    const toDuplicateList = (map: Map<string, Member[]>) => {
      return Array.from(map.entries())
        .filter(([, items]) => items.length > 1)
        .map(([value, items]) => ({
          value,
          count: items.length,
          members: items.map((member) => ({
            id: member.id,
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email,
            phone: member.phone,
            status: member.status,
            createdAt: member.createdAt,
          })),
        }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    };

    const emailDuplicates = toDuplicateList(emailMap);
    const phoneDuplicates = toDuplicateList(phoneMap);

    return {
      hasDuplicates:
        emailDuplicates.length > 0 ||
        phoneDuplicates.length > 0,
      emailDuplicates,
      phoneDuplicates,
    };
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

  async updateProfile(memberId: string, patch: { first_name?: string; last_name?: string; email?: string; phone?: string }) {
    const current = await this.memberRepository.getById(memberId);
    if (!current) throw new ApiError("Member not found", 404);

    const normalizedPatch: Partial<Member> = {
      ...patch,
      email: patch.email !== undefined ? this.normalizeEmail(patch.email) : undefined,
      phone: patch.phone !== undefined ? this.normalizePhone(patch.phone) : undefined,
    };

    if (normalizedPatch.email && !isValidEmail(normalizedPatch.email)) {
      throw new ApiError("Please provide a valid email address", 400);
    }

    if (normalizedPatch.phone && !isValidPhone(normalizedPatch.phone)) {
      throw new ApiError("Please provide a valid phone number", 400);
    }

    await this.assertUniqueCredentialsInGroup({
      groupId: current.groupId,
      email: normalizedPatch.email ?? current.email,
      phone: normalizedPatch.phone ?? current.phone,
      excludeMemberId: current.id,
    });

    const updated = await this.memberRepository.update(memberId, normalizedPatch);
    if (!updated) throw new ApiError("Member not found", 404);
    return { ...updated, passwordHash: "" };
  }

  async changePassword(memberId: string, currentPassword: string, newPassword: string) {
    const member = await this.memberRepository.getById(memberId);
    if (!member) throw new ApiError("Member not found", 404);

    const ok = await verifyPassword(currentPassword, member.passwordHash);
    if (!ok) throw new ApiError("Current password is incorrect", 400);

    if (!isStrongPassword(newPassword)) {
      throw new ApiError(STRONG_PASSWORD_ERROR_MESSAGE, 400);
    }

    const passwordHash = await hashPassword(newPassword);
    const updated = await this.memberRepository.update(memberId, { passwordHash });
    if (!updated) throw new ApiError("Failed to update password", 500);
    return { status: "ok" };
  }

  async recordRegistrationFeePayment(memberId: string) {
    const member = await this.memberRepository.getById(memberId);
    if (!member) throw new ApiError("Member not found", 404);

    const updated = await this.memberRepository.update(memberId, {
      registrationFeePaid: true,
      registrationFeePaidAt: new Date().toISOString(),
    });
    
    if (!updated) throw new ApiError("Failed to record payment", 500);
    return { ...updated, passwordHash: "" };
  }

  async recordSeedDeposit(memberId: string) {
    const member = await this.memberRepository.getById(memberId);
    if (!member) throw new ApiError("Member not found", 404);

    if (member.seedPaid) {
      throw new ApiError("Seed deposit already paid", 400);
    }

    const group = await this.groupRepository.getById(member.groupId);
    if (!group) throw new ApiError("Group not found", 404);

    if (!member.sharesOwned || member.sharesOwned <= 0) {
      throw new ApiError("You must purchase at least one share before paying seed deposit", 400);
    }

    const seedAmountPerShare = group.settings.seedAmount || 0;
    if (seedAmountPerShare <= 0) {
      throw new ApiError("Seed deposit amount per share is not configured", 400);
    }

    const seedAmount = Number((seedAmountPerShare * member.sharesOwned).toFixed(2));

    const updated = await this.memberRepository.update(member.id, {
      seedPaid: true,
      seedPaidAt: new Date().toISOString(),
      balance: member.balance + seedAmount,
    });

    if (!updated) throw new ApiError("Failed to record seed deposit", 500);

    const ledgerEntry: Transaction = {
      id: createId("transaction"),
      groupId: member.groupId,
      memberId: member.id,
      type: "seed_deposit",
      amount: seedAmount,
      description: `Seed / initial deposit (${member.sharesOwned} share${member.sharesOwned === 1 ? "" : "s"} × ${seedAmountPerShare.toLocaleString()})`,
      memberSavingsChange: seedAmount,
      groupIncomeChange: 0,
      groupCashChange: seedAmount,
      createdAt: new Date().toISOString(),
      createdBy: member.id,
    };

    await this.transactionRepository.create(ledgerEntry);

    return { ...updated, passwordHash: "" };
  }

  async purchaseShares(params: { memberId: string; shares: number }) {
    const member = await this.memberRepository.getById(params.memberId);
    if (!member) throw new ApiError("Member not found", 404);

    if (!Number.isFinite(params.shares) || params.shares <= 0) {
      throw new ApiError("Shares must be greater than zero", 400);
    }

    const group = await this.groupRepository.getById(member.groupId);
    if (!group) throw new ApiError("Group not found", 404);

    const shareFee = group.settings.shareFee || 0;
    if (shareFee <= 0) {
      throw new ApiError("Share fee is not configured", 400);
    }

    const amount = Number((shareFee * params.shares).toFixed(2));
    const updated = await this.memberRepository.update(member.id, {
      sharesOwned: member.sharesOwned + params.shares,
      balance: member.balance + amount,
    });

    if (!updated) throw new ApiError("Failed to record share purchase", 500);

    const ledgerEntry: Transaction = {
      id: createId("transaction"),
      groupId: member.groupId,
      memberId: member.id,
      type: "share_purchase",
      amount,
      description: `Share purchase (${params.shares} share${params.shares === 1 ? "" : "s"})`,
      memberSavingsChange: amount,
      groupIncomeChange: 0,
      groupCashChange: amount,
      createdAt: new Date().toISOString(),
      createdBy: member.id,
    };

    await this.transactionRepository.create(ledgerEntry);

    return { ...updated, passwordHash: "" };
  }
}
