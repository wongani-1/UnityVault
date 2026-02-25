import type { AdminRepository, MemberRepository } from "../repositories/interfaces";
import { ApiError } from "../utils/apiError";
import {
  generateTOTPSecret,
  generateBackupCodes,
  verifyTOTPToken,
  generateQRCode,
} from "../utils/twoFactor";

export class TwoFactorService {
  constructor(
    private adminRepository: AdminRepository,
    private memberRepository: MemberRepository
  ) {}

  async enableTwoFactor(params: { userId: string; role: "member" | "group_admin" }) {
    const { userId, role } = params;

    const secret = generateTOTPSecret();
    const backupCodes = generateBackupCodes(10);

    let userEmail = "user";

    if (role === "group_admin") {
      const user = await this.adminRepository.getById(userId);
      if (!user) throw new ApiError("User not found", 404);

      userEmail = user.email || user.username || userId;

      await this.adminRepository.update(userId, {
        ...user,
        twoFactorSecret: secret,
        twoFactorBackupCodes: backupCodes,
        twoFactorEnabled: false, // Only enable after verification
      });
    } else {
      const user = await this.memberRepository.getById(userId);
      if (!user) throw new ApiError("User not found", 404);

      userEmail = user.email || userId;

      await this.memberRepository.update(userId, {
        ...user,
        twoFactorSecret: secret,
        twoFactorBackupCodes: backupCodes,
        twoFactorEnabled: false,
      });
    }

    return {
      secret,
      backupCodes,
      qrCode: generateQRCode(secret, userEmail),
    };
  }

  async verifyAndEnable(params: { userId: string; token: string; role: "member" | "group_admin" }) {
    const { userId, token, role } = params;

    let user;
    if (role === "group_admin") {
      user = await this.adminRepository.getById(userId);
    } else {
      user = await this.memberRepository.getById(userId);
    }

    if (!user) throw new ApiError("User not found", 404);
    if (!user.twoFactorSecret) throw new ApiError("2FA not initialized", 400);

    if (!verifyTOTPToken(user.twoFactorSecret, token)) {
      throw new ApiError("Invalid authentication code", 400);
    }

    if (role === "group_admin") {
      await this.adminRepository.update(userId, {
        ...user,
        twoFactorEnabled: true,
      });
    } else {
      await this.memberRepository.update(userId, {
        ...user,
        twoFactorEnabled: true,
      });
    }

    return { success: true };
  }

  async disableTwoFactor(params: { userId: string; role: "member" | "group_admin" }) {
    const { userId, role } = params;

    let user;
    if (role === "group_admin") {
      user = await this.adminRepository.getById(userId);
      if (!user) throw new ApiError("User not found", 404);

      await this.adminRepository.update(userId, {
        ...user,
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        twoFactorBackupCodes: undefined,
      });
    } else {
      user = await this.memberRepository.getById(userId);
      if (!user) throw new ApiError("User not found", 404);

      await this.memberRepository.update(userId, {
        ...user,
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        twoFactorBackupCodes: undefined,
      });
    }

    return { success: true };
  }

  async verifyToken(params: { userId: string; token: string; role: "member" | "group_admin" }): Promise<boolean> {
    const { userId, token, role } = params;

    let user;
    if (role === "group_admin") {
      user = await this.adminRepository.getById(userId);
    } else {
      user = await this.memberRepository.getById(userId);
    }

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    // Check if token is a TOTP code
    if (verifyTOTPToken(user.twoFactorSecret, token)) {
      return true;
    }

    // Check if token is a backup code
    if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.includes(token)) {
      // Remove the used backup code
      const updatedCodes = user.twoFactorBackupCodes.filter(code => code !== token);
      if (role === "group_admin") {
        await this.adminRepository.update(userId, {
          ...user,
          twoFactorBackupCodes: updatedCodes,
        });
      } else {
        await this.memberRepository.update(userId, {
          ...user,
          twoFactorBackupCodes: updatedCodes,
        });
      }
      return true;
    }

    return false;
  }

  async getBackupCodes(params: { userId: string; role: "member" | "group_admin" }) {
    const { userId, role } = params;

    let user;
    if (role === "group_admin") {
      user = await this.adminRepository.getById(userId);
    } else {
      user = await this.memberRepository.getById(userId);
    }

    if (!user) throw new ApiError("User not found", 404);
    if (!user.twoFactorEnabled) throw new ApiError("2FA not enabled", 400);

    return { backupCodes: user.twoFactorBackupCodes || [] };
  }

  async regenerateBackupCodes(params: { userId: string; role: "member" | "group_admin" }) {
    const { userId, role } = params;

    const newBackupCodes = generateBackupCodes(10);

    let user;
    if (role === "group_admin") {
      user = await this.adminRepository.getById(userId);
      if (!user) throw new ApiError("User not found", 404);

      await this.adminRepository.update(userId, {
        ...user,
        twoFactorBackupCodes: newBackupCodes,
      });
    } else {
      user = await this.memberRepository.getById(userId);
      if (!user) throw new ApiError("User not found", 404);

      await this.memberRepository.update(userId, {
        ...user,
        twoFactorBackupCodes: newBackupCodes,
      });
    }

    return { backupCodes: newBackupCodes };
  }
}
