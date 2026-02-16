import type { AdminRepository, GroupRepository, MemberRepository } from "../repositories/interfaces";
import { verifyPassword } from "../utils/password";
import { ApiError } from "../utils/apiError";

export class AuthService {
  constructor(
    private groupRepository: GroupRepository,
    private adminRepository: AdminRepository,
    private memberRepository: MemberRepository
  ) {}

  async adminLogin(params: { identifier: string; password: string }) {
    const admin = await this.adminRepository.findByIdentifier(params.identifier);
    if (!admin) throw new ApiError("Invalid credentials", 401);

    const ok = await verifyPassword(params.password, admin.passwordHash);
    if (!ok) throw new ApiError("Invalid credentials", 401);

    return {
      userId: admin.id,
      groupId: admin.groupId,
      role: admin.role,
    };
  }

  async memberLogin(params: { identifier: string; password: string }) {
    const member = await this.memberRepository.findByIdentifier(params.identifier);
    if (!member) throw new ApiError("Invalid credentials", 401);
    if (member.status !== "active") throw new ApiError("Member not active", 403);

    const ok = await verifyPassword(params.password, member.passwordHash);
    if (!ok) throw new ApiError("Invalid credentials", 401);

    return {
      userId: member.id,
      groupId: member.groupId,
      role: "member" as const,
    };
  }
}
