import { PrismaClient, Role, CompanyStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1️⃣ Company
  const company = await prisma.company.upsert({
    where: { domain: 'koshpal.com' },
    update: {},
    create: {
      name: 'Koshpal',
      domain: 'koshpal.com',
      employeeLimit: 1000,
      status: CompanyStatus.ACTIVE,
    },
  });

  // 2️⃣ Admin
  await prisma.user.upsert({
    where: { email: 'admin@koshpal.com' },
    update: {},
    create: {
      email: 'admin@koshpal.com',
      passwordHash,
      role: Role.ADMIN,
      companyId: company.id,
      isActive: true,
      adminProfile: {
        create: {
          fullName: 'Koshpal Admin',
        },
      },
    },
  });

  // 3️⃣ HR
  await prisma.user.upsert({
    where: { email: 'hr@koshpal.com' },
    update: {},
    create: {
      email: 'hr@koshpal.com',
      passwordHash,
      role: Role.HR,
      companyId: company.id,
      isActive: true,
      hrProfile: {
        create: {
          fullName: 'Koshpal HR',
          designation: 'HR Manager',
          companyId: company.id,
        },
      },
    },
  });

  // 4️⃣ Employees
  const employees = [
    {
      email: 'emp1@koshpal.com',
      name: 'Employee One',
      code: 'EMP001',
    },
    {
      email: 'emp2@koshpal.com',
      name: 'Employee Two',
      code: 'EMP002',
    },
  ];

  for (const emp of employees) {
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        passwordHash,
        role: Role.EMPLOYEE,
        companyId: company.id,
        isActive: true,
        employeeProfile: {
          create: {
            fullName: emp.name,
            employeeCode: emp.code,
            companyId: company.id,
          },
        },
      },
    });
  }

  // 5️⃣ Coach
  await prisma.user.upsert({
    where: { email: 'coach@koshpal.com' },
    update: {},
    create: {
      email: 'coach@koshpal.com',
      passwordHash,
      role: Role.COACH,
      isActive: true,
      coachProfile: {
        create: {
          specialization: 'Financial Planning & Wellness',
          experienceYears: 8,
          rating: 4.8,
        },
      },
    },
  });

  console.log('✅ Seed completed');
  console.log('🔐 Test logins (password: password123)');
  console.log('ADMIN → admin@koshpal.com');
  console.log('HR → hr@koshpal.com');
  console.log('EMP → emp1@koshpal.com / emp2@koshpal.com');
  console.log('COACH → coach@koshpal.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
