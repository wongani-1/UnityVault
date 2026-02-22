import type { AdminRepository } from "../repositories/interfaces";
import { ApiError } from "../utils/apiError";
import { hashPassword, verifyPassword } from "../utils/password";

export class AdminService {
  constructor(private adminRepository: AdminRepository) {}

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

  async recordSubscriptionPayment(adminId: string) {
    const admin = await this.adminRepository.getById(adminId);
    if (!admin) throw new ApiError("Admin not found", 404);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

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
}