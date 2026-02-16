import type { AdminRepository, MemberRepository } from "../repositories/interfaces";
import { hashPassword } from "../utils/password";
import { ApiError } from "../utils/apiError";
import { generatePasswordResetToken, getPasswordResetExpiryTime } from "../utils/passwordReset";

export class PasswordResetService {
  constructor(
    private adminRepository: AdminRepository,
    private memberRepository: MemberRepository
  ) {}

  async requestReset(params: { identifier: string; role: "member" | "group_admin" }) {
    const { identifier, role } = params;

    let user;
    if (role === "group_admin") {
      user = await this.adminRepository.findByIdentifier(identifier);
    } else {
      user = await this.memberRepository.findByIdentifier(identifier);
    }

    if (!user) throw new ApiError("User not found", 404);

    const token = generatePasswordResetToken();
    const expiresAt = getPasswordResetExpiryTime(60); // 60 minutes

    if (role === "group_admin") {
      await this.adminRepository.update(user.id, {
        ...user,
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt.toISOString(),
      });
    } else {
      await this.memberRepository.update(user.id, {
        ...user,
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt.toISOString(),
      });
    }

    return { token };
  }

  async validateReset(params: { token: string; role: "member" | "group_admin" }) {
    const { token, role } = params;

    let user;
    if (role === "group_admin") {
      const admins = await this.adminRepository.listByGroup("*");
      user = admins.find(a => a.passwordResetToken === token);
    } else {
      const members = await this.memberRepository.listByGroup("*");
      user = members.find(m => m.passwordResetToken === token);
    }

    if (!user) throw new ApiError("Invalid reset token", 400);
    if (!user.passwordResetExpiresAt) throw new ApiError("Invalid reset token", 400);

    const now = new Date();
    const expiresAt = new Date(user.passwordResetExpiresAt);

    if (now > expiresAt) throw new ApiError("Reset token expired", 400);

    return { valid: true, userId: user.id };
  }

  async resetPassword(params: { token: string; newPassword: string; role: "member" | "group_admin" }) {
    const { token, newPassword, role } = params;

    // Validate token first
    const validation = await this.validateReset({ token, role });

    let user;
    if (role === "group_admin") {
      user = await this.adminRepository.getById(validation.userId);
      if (!user) throw new ApiError("User not found", 404);

      const newPasswordHash = await hashPassword(newPassword);
      await this.adminRepository.update(user.id, {
        ...user,
        passwordHash: newPasswordHash,
        passwordResetToken: undefined,
        passwordResetExpiresAt: undefined,
      });
    } else {
      user = await this.memberRepository.getById(validation.userId);
      if (!user) throw new ApiError("User not found", 404);

      const newPasswordHash = await hashPassword(newPassword);
      await this.memberRepository.update(user.id, {
        ...user,
        passwordHash: newPasswordHash,
        passwordResetToken: undefined,
        passwordResetExpiresAt: undefined,
      });
    }

    return { success: true };
  }
}
