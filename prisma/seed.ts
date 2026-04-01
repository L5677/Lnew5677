import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** 日本法定节假日（2026 年为主，演示用）— 生产环境请按官方数据或 API 维护 */
const JP_HOLIDAYS_2026: { date: string; name: string }[] = [
  { date: "2026-01-01", name: "元旦" },
  { date: "2026-01-12", name: "成人节" },
  { date: "2026-02-11", name: "建国纪念日" },
  { date: "2026-02-23", name: "天皇诞生日" },
  { date: "2026-03-20", name: "春分" },
  { date: "2026-04-29", name: "昭和日" },
  { date: "2026-05-03", name: "宪法纪念日" },
  { date: "2026-05-04", name: "绿之日" },
  { date: "2026-05-05", name: "儿童节" },
  { date: "2026-05-06", name: "调休补休" },
  { date: "2026-07-20", name: "海之日" },
  { date: "2026-08-11", name: "山之日" },
  { date: "2026-09-21", name: "敬老日" },
  { date: "2026-09-22", name: "国民休息日" },
  { date: "2026-09-23", name: "秋分" },
  { date: "2026-10-12", name: "体育日" },
  { date: "2026-11-03", name: "文化日" },
  { date: "2026-11-23", name: "勤劳感谢日" },
];

async function main() {
  const hash = await bcrypt.hash("demo123", 10);

  await prisma.holiday.deleteMany();
  await prisma.monthlySubmission.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();

  for (const h of JP_HOLIDAYS_2026) {
    await prisma.holiday.create({ data: h });
  }

  const emp1 = await prisma.employee.create({
    data: { code: "EMP001", name: "张伟", department: "开发部" },
  });
  const emp2 = await prisma.employee.create({
    data: { code: "EMP002", name: "李娜", department: "管理部" },
  });

  await prisma.user.create({
    data: {
      email: "admin@company.local",
      passwordHash: hash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.create({
    data: {
      email: "yamada@company.local",
      passwordHash: hash,
      role: Role.EMPLOYEE,
      employeeId: emp1.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "sato@company.local",
      passwordHash: hash,
      role: Role.EMPLOYEE,
      employeeId: emp2.id,
    },
  });

  console.log(
    "Seed 完成。登录：admin@company.local / yamada@company.local / sato@company.local — 密码 demo123",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
