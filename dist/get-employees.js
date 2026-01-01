"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getEmployeeEmails() {
    const employees = await prisma.user.findMany({
        where: { role: 'EMPLOYEE' },
        select: {
            email: true,
            companyId: true,
            employeeProfile: {
                select: {
                    fullName: true,
                    department: true,
                },
            },
        },
        take: 10,
    });
    console.log('\n📧 Sample Employee Login Credentials (password: password123):\n');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    employees.forEach((emp) => {
        const name = emp.employeeProfile?.fullName || 'Unknown';
        const dept = emp.employeeProfile?.department || 'Unknown';
        console.log(`│ ${emp.email.padEnd(40)} │ ${name.slice(0, 15).padEnd(15)} │`);
    });
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    await prisma.$disconnect();
}
getEmployeeEmails();
//# sourceMappingURL=get-employees.js.map