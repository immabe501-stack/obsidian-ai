import {
  PrismaClient,
  Role,
  EmploymentType,
  Gender,
  MaritalStatus,
  LeaveStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { encryptPII } from "../lib/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // 清空現有資料（依外鍵順序）
  await prisma.auditLog.deleteMany();
  await prisma.leavePayout.deleteMany();
  await prisma.balanceAdjustment.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("password123", 12);

  // ── Admin ─────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      employeeNo: "HR001",
      email: "hr@example.com",
      passwordHash: password,
      name: "HR 小華",
      role: Role.ADMIN,
      hireDate: new Date("2020-01-01"),
      department: "人力資源部",
      jobTitle: "HR Manager",
      employmentType: EmploymentType.FULL_TIME,
    },
  });

  // ── Manager 1（資深工程經理，到職 5 年） ───────────────
  const manager1 = await prisma.user.create({
    data: {
      employeeNo: "E1001",
      email: "alice@example.com",
      passwordHash: password,
      name: "王愛麗",
      role: Role.MANAGER,
      hireDate: new Date("2021-03-15"),
      department: "工程部",
      jobTitle: "Engineering Manager",
      employmentType: EmploymentType.FULL_TIME,
      profile: {
        create: {
          chineseName: "王愛麗",
          englishName: "Alice Wang",
          birthDate: new Date("1988-05-22"),
          gender: Gender.FEMALE,
          maritalStatus: MaritalStatus.MARRIED,
          mobile: "0912-345-678",
          mailingAddress: "台北市信義區松仁路 100 號",
          emergencyContactName: "王大明",
          emergencyContactRelation: "配偶",
          emergencyContactPhone: "0922-111-222",
          nationalIdEncrypted: encryptPII("A223456789"),
          bankName: "台新銀行",
          bankAccountEncrypted: encryptPII("1234567890123"),
        },
      },
    },
  });

  // ── Manager 2（到職 3 年） ───────────────────────────
  const manager2 = await prisma.user.create({
    data: {
      employeeNo: "E1002",
      email: "bob@example.com",
      passwordHash: password,
      name: "陳柏翰",
      role: Role.MANAGER,
      hireDate: new Date("2023-02-01"),
      department: "產品部",
      jobTitle: "Product Manager",
      employmentType: EmploymentType.FULL_TIME,
      profile: {
        create: {
          chineseName: "陳柏翰",
          englishName: "Bob Chen",
          birthDate: new Date("1990-11-08"),
          gender: Gender.MALE,
          maritalStatus: MaritalStatus.SINGLE,
          mobile: "0933-666-777",
          mailingAddress: "新北市板橋區文化路一段 50 號",
          emergencyContactName: "陳爸",
          emergencyContactRelation: "父親",
          emergencyContactPhone: "0911-999-888",
          nationalIdEncrypted: encryptPII("B112233445"),
          bankName: "玉山銀行",
          bankAccountEncrypted: encryptPII("9876543210000"),
        },
      },
    },
  });

  // ── 員工們 ─────────────────────────────────────────────
  const employees = await Promise.all([
    // 到職 2 年 — alice 的部屬
    prisma.user.create({
      data: {
        employeeNo: "E2001",
        email: "carol@example.com",
        passwordHash: password,
        name: "林佳怡",
        role: Role.EMPLOYEE,
        hireDate: new Date("2024-04-10"),
        department: "工程部",
        jobTitle: "Senior Engineer",
        managerId: manager1.id,
        profile: {
          create: {
            chineseName: "林佳怡",
            englishName: "Carol Lin",
            birthDate: new Date("1995-07-14"),
            gender: Gender.FEMALE,
            maritalStatus: MaritalStatus.SINGLE,
            mobile: "0955-123-456",
            emergencyContactName: "林媽",
            emergencyContactRelation: "母親",
            emergencyContactPhone: "0966-777-888",
            nationalIdEncrypted: encryptPII("F234567890"),
            bankName: "中信銀行",
            bankAccountEncrypted: encryptPII("5556667778888"),
          },
        },
      },
    }),
    // 到職 1.5 年 — alice 的部屬
    prisma.user.create({
      data: {
        employeeNo: "E2002",
        email: "david@example.com",
        passwordHash: password,
        name: "張大衛",
        role: Role.EMPLOYEE,
        hireDate: new Date("2024-10-01"),
        department: "工程部",
        jobTitle: "Engineer",
        managerId: manager1.id,
        profile: {
          create: {
            chineseName: "張大衛",
            englishName: "David Chang",
            mobile: "0977-555-444",
            emergencyContactName: "張太太",
            emergencyContactRelation: "配偶",
            emergencyContactPhone: "0988-111-222",
          },
        },
      },
    }),
    // 到職 8 個月 — bob 的部屬
    prisma.user.create({
      data: {
        employeeNo: "E2003",
        email: "eve@example.com",
        passwordHash: password,
        name: "李怡安",
        role: Role.EMPLOYEE,
        hireDate: new Date("2025-09-01"),
        department: "產品部",
        jobTitle: "Product Designer",
        managerId: manager2.id,
        profile: {
          create: {
            chineseName: "李怡安",
            englishName: "Eve Lee",
            mobile: "0922-333-444",
          },
        },
      },
    }),
    // 到職 4 個月（尚無特休）— bob 的部屬
    prisma.user.create({
      data: {
        employeeNo: "E2004",
        email: "frank@example.com",
        passwordHash: password,
        name: "黃豐凱",
        role: Role.EMPLOYEE,
        hireDate: new Date("2026-01-15"),
        department: "產品部",
        jobTitle: "Junior PM",
        managerId: manager2.id,
        profile: {
          create: {
            chineseName: "黃豐凱",
            englishName: "Frank Huang",
            mobile: "0911-222-333",
          },
        },
      },
    }),
  ]);

  // ── 一些請假紀錄 ────────────────────────────────────────
  const [carol, david, eve] = employees;

  await prisma.leaveRequest.create({
    data: {
      requesterId: carol.id,
      startDate: new Date("2026-04-20"),
      endDate: new Date("2026-04-22"),
      days: 3,
      reason: "家庭旅遊",
      status: LeaveStatus.APPROVED,
      approverId: manager1.id,
      decidedAt: new Date("2026-04-10"),
      decisionNote: "好好玩~",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      requesterId: carol.id,
      startDate: new Date("2026-06-05"),
      endDate: new Date("2026-06-05"),
      days: 0.5,
      isHalfDay: true,
      halfDayPeriod: "PM",
      reason: "下午看牙醫",
      status: LeaveStatus.PENDING,
    },
  });

  await prisma.leaveRequest.create({
    data: {
      requesterId: david.id,
      startDate: new Date("2026-05-30"),
      endDate: new Date("2026-06-01"),
      days: 3,
      reason: "返鄉",
      status: LeaveStatus.PENDING,
    },
  });

  await prisma.leaveRequest.create({
    data: {
      requesterId: eve.id,
      startDate: new Date("2026-05-20"),
      endDate: new Date("2026-05-20"),
      days: 1,
      reason: "處理租屋事宜",
      status: LeaveStatus.REJECTED,
      approverId: manager2.id,
      decidedAt: new Date("2026-05-12"),
      decisionNote: "當天有重要 review，請改期",
    },
  });

  console.log("Seed completed.");
  console.log("登入帳號（密碼皆為 password123）：");
  console.log("  Admin   : hr@example.com");
  console.log("  Manager : alice@example.com / bob@example.com");
  console.log("  Employee: carol@example.com / david@example.com / eve@example.com / frank@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
