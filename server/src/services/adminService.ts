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

  async updateProfile(adminId: string, patch: { fullName?: string; email?: string; phone?: string; username?: string }) {
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
}