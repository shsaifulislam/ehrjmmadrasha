import 'dotenv/config';
import prisma from './config/prisma';
import { createInvoiceWithItems, collectPayment } from './services/finance.service';
import bcrypt from 'bcryptjs';

async function runFinanceIntegrityTest() {
  console.log("==================================================");
  console.log("          FINANCE INTEGRITY TEST RUNNER           ");
  console.log("==================================================");

  try {
    // Clean up or ensure dependencies exist
    console.log("1. Setting up mock environment...");
    
    // Find or create STUDENT role
    let studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    if (!studentRole) {
      studentRole = await prisma.role.create({
        data: { name: 'STUDENT', description: 'Student Role' }
      });
    }

    // Find or create default session & class
    const session = await prisma.session.upsert({
      where: { id: 'test-session-id' }, // just a placeholder or use findFirst/create
      create: { year: '2026', isActive: true },
      update: {}
    });

    const cls = await prisma.class.create({
      data: { name: 'Class Ten', numericValue: 10 }
    });

    // Create a mock User for the student
    const defaultPassword = await bcrypt.hash("student123", 10);
    const user = await prisma.user.create({
      data: {
        username: "test_student_integrity",
        passwordHash: defaultPassword,
        roleId: studentRole.id,
        isActive: true
      }
    });

    // Create student
    const student = await prisma.student.create({
      data: {
        studentId: "STU-INTEGRITY-01",
        roll: 1,
        nameBn: "ইন্টিগ্রিটি টেস্ট স্টুডেন্ট",
        classId: cls.id,
        sessionId: session.id,
        userId: user.id
      }
    });
    console.log(`✅ Student created: ${student.nameBn} (ID: ${student.studentId})`);

    // Create FeeType
    const feeType = await prisma.feeType.create({
      data: { name: 'মাসিক বেতন', defaultAmount: 1000 }
    });
    console.log(`✅ FeeType created: ${feeType.name}`);

    // Find or create an ADMIN user to act as recorder
    let adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { name: 'ADMIN', description: 'Admin Role' }
      });
    }
    const adminUser = await prisma.user.create({
      data: {
        username: "admin_recorder",
        passwordHash: defaultPassword,
        roleId: adminRole.id,
        isActive: true
      }
    });

    // 3. Create invoice with total 1000
    console.log("\n2. Creating invoice with total 1000...");
    const invoice = await createInvoiceWithItems(
      student.id,
      2026,
      6,
      'MONTHLY',
      [{ feeTypeId: feeType.id, amount: 1000 }],
      adminUser.id
    );

    console.log(`✅ Invoice created. Total: ${invoice.totalAmount}, Status: ${invoice.status}`);
    if (Number(invoice.totalAmount) !== 1000) {
      throw new Error(`Invoice amount mismatch! Expected 1000, got ${invoice.totalAmount}`);
    }

    // 4. Collect 500
    console.log("\n3. Collecting first payment of 500...");
    const pay1 = await collectPayment(invoice.id, 500, 'CASH', adminUser.id);
    console.log(`✅ Payment 1 recorded. Invoice Status: ${pay1.newStatus}, Receipt: ${pay1.receipt.receiptNumber}`);
    if (pay1.newStatus !== 'PARTIAL') {
      throw new Error(`Expected PARTIAL status, got ${pay1.newStatus}`);
    }

    // 5. Collect 500
    console.log("\n4. Collecting second payment of 500...");
    const pay2 = await collectPayment(invoice.id, 500, 'CASH', adminUser.id);
    console.log(`✅ Payment 2 recorded. Invoice Status: ${pay2.newStatus}, Receipt: ${pay2.receipt.receiptNumber}`);
    if (pay2.newStatus !== 'PAID') {
      throw new Error(`Expected PAID status, got ${pay2.newStatus}`);
    }

    // 6. Try to collect 1 more
    console.log("\n5. Trying to collect 1 more (overpayment check)...");
    try {
      await collectPayment(invoice.id, 1, 'CASH', adminUser.id);
      console.log("❌ Failed: Overpayment was accepted!");
    } catch (err: any) {
      console.log(`✅ Passed: Overpayment rejected with message: "${err.message}"`);
    }

    // 7. Try amount 0
    console.log("\n6. Trying to collect 0 amount...");
    try {
      await collectPayment(invoice.id, 0, 'CASH', adminUser.id);
      console.log("❌ Failed: 0 amount was accepted!");
    } catch (err: any) {
      console.log(`✅ Passed: 0 amount rejected with message: "${err.message}"`);
    }

    // 8. Verify audit logs
    console.log("\n7. Verifying audit logs...");
    const logs = await prisma.auditLog.findMany({
      where: { userId: adminUser.id }
    });
    console.log(`✅ Found ${logs.length} audit logs for admin recorder.`);
    logs.forEach(log => {
      console.log(`  - [Action: ${log.action}] Details: ${log.details} on Resource: ${log.resource}`);
    });

    console.log("\n==================================================");
    console.log("       FINANCE INTEGRITY TEST RUN PASSED!         ");
    console.log("==================================================");

  } catch (error: any) {
    console.error("\n❌ Test execution failed!");
    console.error(error.stack || error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

runFinanceIntegrityTest();
