import { store } from "./repositories/memory/store";
import { hashPassword } from "./utils/password";
import type { Group, Admin, Member, Loan } from "./models/types";

export async function seedData() {
  // Create test group
  const testGroup: Group = {
    id: "group_test_001",
    name: "Test Savings Group",
    createdAt: new Date("2025-01-01").toISOString(),
    settings: {
      contributionAmount: 50000,
      loanInterestRate: 5,
      penaltyRate: 10,
      compulsoryInterestRate: 2,
    },
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
      interestRate: 5,
      totalInterest: 15000,
      totalDue: 315000,
      installments: [],
      status: "pending",
      createdAt: new Date("2026-02-03").toISOString(),
    },
    {
      id: "loan_002",
      groupId: testGroup.id,
      memberId: "member_001",
      principal: 150000,
      interestRate: 5,
      totalInterest: 7500,
      totalDue: 157500,
      installments: [],
      status: "approved",
      createdAt: new Date("2026-01-28").toISOString(),
      approvedAt: new Date("2026-01-29").toISOString(),
    },
  ];

  testLoans.forEach((loan) => store.loans.set(loan.id, loan));

  console.log("✅ Test data seeded successfully");
  console.log("   Group:", testGroup.name, `(${testGroup.id})`);
  console.log("   Admin:", testAdmin.username, "/ admin123");
  console.log("   Members:", testMembers.length, "(username: alice, robert, grace / password: member123)");
  console.log("   Loans:", testLoans.length);
}
