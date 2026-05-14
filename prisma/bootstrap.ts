/**
 * 首次部署自動建立 HR 管理員帳號
 *
 * 行為：
 *   - 若資料庫內已有任何 User，跳過（不會洗掉現有資料）
 *   - 否則用 INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD / INITIAL_ADMIN_NAME 建立第一位 admin
 *
 * 在 Vercel build 時會自動執行（見 package.json 的 build script）
 */

import { PrismaClient, EmploymentType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`[bootstrap] 已有 ${count} 位使用者，跳過初始管理員建立。`);
    return;
  }

  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME ?? "HR Admin";

  if (!email || !password) {
    console.warn(
      "[bootstrap] 找不到 INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD，跳過。\n" +
        "          首次部署請在環境變數內設定這兩個值，重新部署後會自動建立首位 admin。",
    );
    return;
  }
  if (password.length < 8) {
    console.error("[bootstrap] INITIAL_ADMIN_PASSWORD 至少需 8 字元");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const today = new Date();

  await prisma.user.create({
    data: {
      employeeNo: "HR001",
      email,
      name,
      passwordHash,
      role: Role.ADMIN,
      hireDate: today,
      department: "人力資源部",
      jobTitle: "HR Admin",
      employmentType: EmploymentType.FULL_TIME,
      profile: { create: { chineseName: name } },
    },
  });

  console.log(`[bootstrap] ✓ 已建立首位管理員：${email}`);
  console.log(`[bootstrap]   登入後請立刻在 HR 後台修改密碼或新增其他 admin 帳號。`);
}

main()
  .catch((e) => {
    console.error("[bootstrap] 失敗：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
