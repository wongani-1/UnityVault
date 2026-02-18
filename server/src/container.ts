import { env } from "./config/env";
import * as memoryRepositories from "./repositories/memory";
import * as supabaseRepositories from "./repositories/supabase";
import { AuditService } from "./services/auditService";
import { AdminService } from "./services/adminService";
import { NotificationService } from "./services/notificationService";
import { PenaltyService } from "./services/penaltyService";
import { GroupService } from "./services/groupService";
import { MemberService } from "./services/memberService";
import { ContributionService } from "./services/contributionService";
import { LoanService } from "./services/loanService";
import { AuthService } from "./services/authService";
import { EmailService } from "./services/emailService";
import { PasswordResetService } from "./services/passwordResetService";
import { TwoFactorService } from "./services/twoFactorService";
import { SessionService } from "./services/sessionService";
import { DistributionService } from "./services/distributionService";

const repositories =
  env.dataStore === "supabase" ? supabaseRepositories : memoryRepositories;

const emailService = new EmailService();
const auditService = new AuditService(repositories.auditRepository);
const adminService = new AdminService(repositories.adminRepository);
const notificationService = new NotificationService(repositories.notificationRepository);
const penaltyService = new PenaltyService(
  repositories.penaltyRepository,
  repositories.memberRepository,
  repositories.groupRepository,
  repositories.transactionRepository
);
const groupService = new GroupService(
  repositories.groupRepository,
  repositories.adminRepository,
  auditService
);
const memberService = new MemberService(
  repositories.memberRepository,
  repositories.groupRepository,
  auditService,
  notificationService,
  emailService
);
const contributionService = new ContributionService(
  repositories.contributionRepository,
  repositories.memberRepository,
  repositories.penaltyRepository,
  repositories.groupRepository,
  emailService
);
const loanService = new LoanService(
  repositories.loanRepository,
  repositories.memberRepository,
  repositories.penaltyRepository,
  repositories.groupRepository,
  repositories.notificationRepository,
  repositories.contributionRepository,
  repositories.auditRepository,
  emailService
);
const authService = new AuthService(
  repositories.groupRepository,
  repositories.adminRepository,
  repositories.memberRepository
);
const passwordResetService = new PasswordResetService(
  repositories.adminRepository,
  repositories.memberRepository
);
const twoFactorService = new TwoFactorService(
  repositories.adminRepository,
  repositories.memberRepository
);
const sessionService = new SessionService();
const distributionService = new DistributionService(
  repositories.contributionRepository,
  repositories.loanRepository,
  repositories.penaltyRepository,
  repositories.memberRepository,
  repositories.groupRepository,
  repositories.distributionRepository
);

export const container = {
  adminService,
  auditService,
  emailService,
  notificationService,
  penaltyService,
  groupService,
  memberService,
  contributionService,
  loanService,
  authService,
  passwordResetService,
  twoFactorService,
  sessionService,
  distributionService,
};
