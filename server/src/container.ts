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
import { PaymentService } from "./services/paymentService";
import { LedgerService } from "./services/ledgerService";

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
  repositories.transactionRepository,
  repositories.distributionRepository
);
const groupService = new GroupService(
  repositories.groupRepository,
  repositories.adminRepository,
  auditService,
  repositories.distributionRepository
);
const memberService = new MemberService(
  repositories.memberRepository,
  repositories.groupRepository,
  auditService,
  notificationService,
  emailService,
  repositories.distributionRepository,
  repositories.transactionRepository
);
const contributionService = new ContributionService(
  repositories.contributionRepository,
  repositories.memberRepository,
  repositories.penaltyRepository,
  repositories.groupRepository,
  repositories.transactionRepository,
  repositories.loanRepository,
  emailService,
  repositories.distributionRepository
);
const loanService = new LoanService(
  repositories.loanRepository,
  repositories.memberRepository,
  repositories.penaltyRepository,
  repositories.groupRepository,
  repositories.notificationRepository,
  repositories.contributionRepository,
  repositories.auditRepository,
  repositories.transactionRepository,
  emailService,
  repositories.distributionRepository
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
  repositories.distributionRepository,
  repositories.transactionRepository
);
const paymentService = new PaymentService();
const ledgerService = new LedgerService(repositories.transactionRepository);

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
  paymentService,
  ledgerService,
  paymentRepository: repositories.paymentRepository,
};
