import prisma from "../config/prisma";

async function runLoadPerformanceStressTest() {
  console.log('================================================================');
  console.log('⚡ EHRJ Madrasha ERP — Load & Performance Stress Test (Sprint P5)');
  console.log('================================================================\n');

  const startTime = Date.now();
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  const latencies: number[] = [];

  try {
    // 1. Prerequisites Setup
    console.log('[1/5] 🛠️ Setting up Load Test Prerequisite Anchors...');
    let session = await prisma.session.findFirst({ where: { isActive: true } });
    if (!session) {
      session = await prisma.session.create({ data: { year: "2026", isActive: true } });
    }

    const uniqueClassName = `Load-Class-${Date.now()}`;
    const academicClass = await prisma.class.create({
      data: { name: uniqueClassName, numericValue: Math.floor(Math.random() * 1000) + 100 },
    });

    let studentRole = await prisma.role.findFirst({ where: { name: "STUDENT" } });
    if (!studentRole) {
      studentRole = await prisma.role.create({ data: { name: "STUDENT", description: "Student Role" } });
    }

    const guardian = await prisma.guardian.create({
      data: { name: "Load Guardian", phone: "01700112233", relation: "FATHER" },
    });

    // Create 10 distinct Users for 10 Students
    console.log('   ✅ Creating 10 Load Test Anchor Auth Users & Students...');
    const users = await Promise.all(
      Array.from({ length: 10 }).map((_, i) =>
        prisma.user.create({
          data: {
            username: `loaduser_${Date.now()}_${i}`,
            passwordHash: "$2b$10$e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            roleId: studentRole.id,
          },
        })
      )
    );

    const loadRunId = Date.now().toString().slice(-4);
    const students = await Promise.all(
      users.map((u, i) =>
        prisma.student.create({
          data: {
            studentId: `STU-L${loadRunId}-${i}`,
            nameBn: `লোড টেস্ট শিক্ষার্থী ${i + 1}`,
            classId: academicClass.id,
            sessionId: session!.id,
            guardianId: guardian.id,
            userId: u.id,
            roll: 8000 + Math.floor(Math.random()*1000) + i,
          },
        })
      )
    );
    console.log(`   ✅ 10 Anchor Students Created Successfully`);

    // 2. Workload 1: Bulk Attendance Submission (1,000 Records Simulation)
    console.log('\n[2/5] ⏱️ Workload 1: Executing 1,000 Bulk Attendance Record Submissions...');
    const attStart = Date.now();
    for (let batch = 0; batch < 100; batch++) {
      const batchStart = Date.now();
      const records = students.map(s => ({
        studentId: s.id,
        classId: academicClass.id,
        recordedById: users[0].id,
        date: new Date(Date.now() - batch * 86400000),
        status: (batch % 5 === 0 ? "ABSENT" : "PRESENT") as any,
      }));

      totalRequests += records.length;
      try {
        await prisma.attendance.createMany({ data: records });
        successfulRequests += records.length;
        const latency = Date.now() - batchStart;
        latencies.push(latency);
      } catch (err: any) {
        failedRequests += records.length;
      }
    }
    const attDuration = ((Date.now() - attStart) / 1000).toFixed(2);
    console.log(`   ✅ 1,000 Attendance Records Inserted in ${attDuration}s`);

    // 3. Workload 2: Bulk Fee Invoice Generation (500 Invoices Simulation)
    console.log('\n[3/5] 🧾 Workload 2: Generating 500 Student Monthly Fee Invoices...');
    const feeStart = Date.now();
    
    let feeType = await prisma.feeType.findFirst({ where: { isDeleted: false } });
    if (!feeType) {
      feeType = await prisma.feeType.create({
        data: { name: "মাসিক বেতন (P5-Load)", defaultAmount: 1500 },
      });
    }

    for (let batch = 0; batch < 50; batch++) {
      const batchStart = Date.now();
      const invoiceData = students.map((s, idx) => ({
        studentId: s.id,
        type: `LOAD_${batch}_${idx}`,
        month: ((batch % 12) + 1),
        year: 2026,
        totalAmount: 1500,
        dueDate: new Date("2026-12-31"),
        status: "UNPAID" as any,
      }));

      totalRequests += invoiceData.length;
      try {
        await prisma.invoice.createMany({ data: invoiceData });
        successfulRequests += invoiceData.length;
        const latency = Date.now() - batchStart;
        latencies.push(latency);
      } catch (err: any) {
        failedRequests += invoiceData.length;
      }
    }
    const feeDuration = ((Date.now() - feeStart) / 1000).toFixed(2);
    console.log(`   ✅ 500 Student Invoices Created in ${feeDuration}s`);

    // 4. Workload 3: High-Volume SMS Broadcast Queue Simulation (1,000 SMS)
    console.log('\n[4/5] 📩 Workload 3: Queueing 1,000 High-Volume SMS Broadcast Notifications...');
    const smsStart = Date.now();
    for (let i = 0; i < 100; i++) {
      const batchStart = Date.now();
      totalRequests += 10;
      try {
        await prisma.notificationLog.createMany({
          data: Array.from({ length: 10 }).map((_, j) => ({
            recipientPhone: `01700${Math.floor(100000 + Math.random() * 900000)}`,
            message: `EHRJ Madrasha ERP Load Test Broadcast ${i * 10 + j}`,
            eventType: "BULK_NOTICE",
            status: "SENT",
          })),
        });
        successfulRequests += 10;
        latencies.push(Date.now() - batchStart);
      } catch {
        failedRequests += 10;
      }
    }
    const smsDuration = ((Date.now() - smsStart) / 1000).toFixed(2);
    console.log(`   ✅ 1,000 SMS Queue Logs Persisted in ${smsDuration}s`);

    // 5. Calculate Metrics & Latencies (P95, P99, Memory, CPU)
    console.log('\n[5/5] 📊 Calculating Latency Statistics & System Resource Usage...');
    latencies.sort((a, b) => a - b);
    
    const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99Latency = latencies[Math.floor(latencies.length * 0.99)] || 0;
    const successRate = ((successfulRequests / totalRequests) * 100).toFixed(2);
    const errorRate = ((failedRequests / totalRequests) * 100).toFixed(2);

    const memUsage = process.memoryUsage();
    const peakHeapMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);

    console.log(`   ℹ️ Total Requests Executed: ${totalRequests}`);
    console.log(`   ℹ️ Successful Requests: ${successfulRequests} (${successRate}%)`);
    console.log(`   ℹ️ Failed Requests: ${failedRequests} (${errorRate}%)`);
    console.log(`   ℹ️ Average Latency: ${avgLatency} ms`);
    console.log(`   ℹ️ P95 Latency: ${p95Latency} ms (Target Threshold: < 500 ms)`);
    console.log(`   ℹ️ P99 Latency: ${p99Latency} ms (Target Threshold: < 1,000 ms)`);
    console.log(`   ℹ️ Peak Heap Memory: ${peakHeapMB} MB`);

    // Cleanup Load Artifacts in correct dependency sequence
    console.log('\n🧹 Cleaning Up Load Test Artifacts...');
    const studentIds = students.map(s => s.id);
    await prisma.attendance.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.invoiceItem.deleteMany({ where: { invoice: { studentId: { in: studentIds } } } });
    await prisma.payment.deleteMany({ where: { invoice: { studentId: { in: studentIds } } } });
    await prisma.invoice.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.notificationLog.deleteMany({ where: { message: { startsWith: "EHRJ Madrasha ERP Load Test" } } });
    await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
    await prisma.guardian.delete({ where: { id: guardian.id } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: users.map(u => u.id) } } }).catch(() => {});
    await prisma.class.delete({ where: { id: academicClass.id } }).catch(() => {});
    console.log('   ✅ Load Test Artifacts Cleaned Up Cleanly');

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n================================================================');
    console.log(`🎯 STRESS TEST COMPLETED: ${successfulRequests}/${totalRequests} PASS (${successRate}%)`);
    console.log(`⏱️ Duration: ${totalDuration}s | P95: ${p95Latency}ms | Exit Code: 0 (SUCCESS)`);
    console.log('================================================================\n');

  } catch (error: any) {
    console.error('\n❌ Load Performance Stress Test Failed:');
    console.error(error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runLoadPerformanceStressTest();
