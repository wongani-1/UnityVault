import {
  adminRepository,
  auditRepository,
  contributionRepository,
  groupRepository,
  loanRepository,
  memberRepository,
  notificationRepository,
  penaltyRepository,
  transactionRepository,
} from "./repositories/memory";
import { AuditService } from "./services/auditService";
import { AdminService } from "./services/adminService";
import { NotificationService } from "./services/notificationService";
import { PenaltyService } from "./services/penaltyService";
import { GroupService } from "./services/groupService";
import { MemberService } from "./services/memberService";
import { ContributionService } from "./services/contributionService";
import { LoanService } from "./services/loanService";
import { AuthService } from "./services/authService";

const auditService = new AuditService(auditRepository);
const adminService = new AdminService(adminRepository);
const notificationService = new NotificationService(notificationRepository);
const penaltyService = new PenaltyService(
  penaltyRepository,
  memberRepository,
  groupRepository,
  transactionRepository
);
const groupService = new GroupService(groupRepository, adminRepository, auditService);
const memberService = new MemberService(
  memberRepository,
  auditService,
  notificationService
);
const contributionService = new ContributionService(
  contributionRepository,
  memberRepository,
  penaltyRepository,
  groupRepository
);
const loanService = new LoanService(
  loanRepository,
  memberRepository,
  penaltyRepository,
  groupRepository,
  notificationRepository,
  contributionRepository,
  auditRepository
);
const authService = new AuthService(
  groupRepository,
  adminRepository,
  memberRepository
);

export const container = {
  adminService,
  auditService,
  notificationService,
  penaltyService,
  groupService,
  memberService,
  contributionService,
  loanService,
  authService,
};
