import { store } from "./repositories/memory/store";
import { hashPassword } from "./utils/password";
import type { Group, Admin, Member, Loan, Contribution } from "./models/types";

export async function seedData() {
  // Create test group
  const testGroup: Group = {
    id: "group_test_001",
    name: "Test Savings Group",
    createdAt: new Date("2025-01-01").toISOString(),
    settings: {
      contributionAmount: 50000,
      loanInterestRate: 0.05, // 5%
      penaltyRate: 0.10, // 10% penalty for missed loan payments
      contributionPenaltyRate: 0.10, // 10% penalty for missed contributions
      compulsoryInterestRate: 0.02, // 2%
      minimumContributionMonths: 3, // Minimum 3 months of contributions
      loanToSavingsRatio: 2.0, // Can borrow up to 200% of savings
      enableAutomaticPenalties: true, // Auto-apply penalties for overdue
    },
    totalSavings: 0, // Will be updated as members contribute
    totalIncome: 0, // Interest and penalties
    cash: 0, // Available cash
  };
  store.groups.set(testGroup.id, testGroup);

  // Create test admin
  const adminPasswordHash = await hashPassword("admin123");
  const testAdmin: Admin = {
    id: "admin_test_001",
    groupId: testGroup.id,
    email: "admin@test.com",
    username: "admin",
    passwordHash: adminPasswordHash,
    role: "group_admin",
    fullName: "Test Admin",
    phone: "+265999001122",
    createdAt: new Date("2025-01-01").toISOString(),
    twoFactorEnabled: false,
  };
  store.admins.set(testAdmin.id, testAdmin);

  // Create test members
  const memberPasswordHash = await hashPassword("member123");
  const testMembers: Member[] = [
    {
      id: "member_001",
      groupId: testGroup.id,
      email: "alice@test.com",
      username: "alice",
      passwordHash: memberPasswordHash,
      fullName: "Alice Namukasa",
      phone: "+265999111111",
      status: "active",
      balance: 150000,
      penaltiesTotal: 0,
      createdAt: new Date("2025-01-15").toISOString(),
      twoFactorEnabled: false,
    },
    {
      id: "member_002",
      groupId: testGroup.id,
      email: "robert@test.com",
      username: "robert",
      passwordHash: memberPasswordHash,
      fullName: "Robert Ochieng",
      phone: "+265999222222",
      status: "active",
      balance: 100000,
      penaltiesTotal: 0,
      createdAt: new Date("2025-01-20").toISOString(),
      twoFactorEnabled: false,
    },
    {
      id: "member_003",
      groupId: testGroup.id,
      email: "grace@test.com",
      username: "grace",
      passwordHash: memberPasswordHash,
      fullName: "Grace Atim",
      phone: "+265999333333",
      status: "pending",
      balance: 0,
      penaltiesTotal: 0,
      createdAt: new Date("2026-02-01").toISOString(),
      twoFactorEnabled: false,
    },
  ];

  testMembers.forEach((member) => store.members.set(member.id, member));

  // Create test loan requests
  const testLoans: Loan[] = [
    {
      id: "loan_001",
      groupId: testGroup.id,
      memberId: "member_002",
      principal: 300000,
      interestRate: 0,
      totalInterest: 0,
      totalDue: 300000,
      balance: 300000,
      installments: [],
      status: "pending",
      reason: "Business expansion",
      createdAt: new Date("2026-02-03").toISOString(),
    },
    {
      id: "loan_002",
      groupId: testGroup.id,
      memberId: "member_001",
      principal: 150000,
      interestRate: 0.05,
      totalInterest: 7500,
      totalDue: 157500,
      balance: 157500,
      installments: [],
      status: "active",
      createdAt: new Date("2026-01-28").toISOString(),
      approvedAt: new Date("2026-01-29").toISOString(),
    },
  ];

  testLoans.forEach((loan) => store.loans.set(loan.id, loan));

  // Create test contributions
  const testContributions: Contribution[] = [
    // Alice's contributions (3 paid)
    {
      id: "contrib_001",
      groupId: testGroup.id,
      memberId: "member_001",
      amount: 50000,
      month: "2025-01",
      status: "paid",
      dueDate: new Date("2025-01-31").toISOString(),
      createdAt: new Date("2025-01-15").toISOString(),
      paidAt: new Date("2025-01-20").toISOString(),
    },
    {
      id: "contrib_002",
      groupId: testGroup.id,
      memberId: "member_001",
      amount: 50000,
      month: "2025-02",
      status: "paid",
      dueDate: new Date("2025-02-28").toISOString(),
      createdAt: new Date("2025-02-01").toISOString(),
      paidAt: new Date("2025-02-15").toISOString(),
    },
    {
      id: "contrib_003",
      groupId: testGroup.id,
      memberId: "member_001",
      amount: 50000,
      month: "2026-01",
      status: "paid",
      dueDate: new Date("2026-01-31").toISOString(),
      createdAt: new Date("2026-01-01").toISOString(),
      paidAt: new Date("2026-01-25").toISOString(),
    },
    {
      id: "contrib_004",
      groupId: testGroup.id,
      memberId: "member_001",
      amount: 50000,
      month: "2026-02",
      status: "unpaid",
      dueDate: new Date("2026-02-28").toISOString(),
      createdAt: new Date("2026-02-01").toISOString(),
    },
    // Robert's contributions (2 paid)
    {
      id: "contrib_005",
      groupId: testGroup.id,
      memberId: "member_002",
      amount: 50000,
      month: "2025-02",
      status: "paid",
      dueDate: new Date("2025-02-28").toISOString(),
      createdAt: new Date("2025-02-01").toISOString(),
      paidAt: new Date("2025-02-10").toISOString(),
    },
    {
      id: "contrib_006",
      groupId: testGroup.id,
      memberId: "member_002",
      amount: 50000,
      month: "2026-01",
      status: "paid",
      dueDate: new Date("2026-01-31").toISOString(),
      createdAt: new Date("2026-01-01").toISOString(),
      paidAt: new Date("2026-01-28").toISOString(),
    },
    {
      id: "contrib_007",
      groupId: testGroup.id,
      memberId: "member_002",
      amount: 50000,
      month: "2026-02",
      status: "unpaid",
      dueDate: new Date("2026-02-28").toISOString(),
      createdAt: new Date("2026-02-01").toISOString(),
    },
  ];

  testContributions.forEach((contribution) => 
    store.contributions.set(contribution.id, contribution)
  );

  console.log("✅ Test data seeded successfully");
  console.log("   Group:", testGroup.name, `(${testGroup.id})`);
  console.log("   Admin:", testAdmin.username, "/ admin123");
  console.log("   Members:", testMembers.length, "(username: alice, robert, grace / password: member123)");
  console.log("   Loans:", testLoans.length);
  console.log("   Contributions:", testContributions.length);
}
