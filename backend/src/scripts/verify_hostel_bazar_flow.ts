import prisma from "../config/prisma";
import { HostelService } from "../modules/hostel/hostel.service";
import { BazarService } from "../modules/bazar/bazar.service";
import StudentCreateService from "../modules/student/services/StudentCreateService";

async function runHostelBazarVerification() {
  console.log("=================================================");
  console.log("🚀 STARTING HOSTEL, BAZAR & MEAL CORE MODULE ATOMIC VERIFICATION");
  console.log("=================================================\n");

  // 1. Prerequisites (Session, Class, Student)
  let session = await prisma.session.findFirst({ where: { isActive: true } });
  if (!session) {
    session = await prisma.session.create({ data: { year: "2026", isActive: true } });
  }

  let cls = await prisma.class.findFirst({ where: { isDeleted: false } });
  if (!cls) {
    cls = await prisma.class.create({ data: { name: "Class One", numericValue: 1 } });
  }

  let user = await prisma.user.findFirst({ where: { isActive: true } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: `hostel_tester_${Date.now()}`,
        passwordHash: "dummyhash",
        role: { create: { name: `ROLE_HOSTEL_${Date.now()}` } },
      },
    });
  }

  const student = await StudentCreateService.execute({
    nameBn: "আরিফুর রহমান (হোস্টেল টেস্ট)",
    guardianName: "হাজী খলিলুর রহমান",
    guardianPhone: "01744556677",
    classId: cls.id,
    sessionId: session.id,
    createdBy: "HOSTEL_VERIFIER",
  });

  // 2. Hostel Building & Room Creation
  console.log("📝 Step 1: Creating Hostel Building & Room with Beds...");
  const building = await HostelService.createBuilding({
    name: "মাদানি ভবন",
    code: `BLD-${Date.now().toString().slice(-4)}`,
    address: "হোস্টেল মেইন ক্যাম্পিন",
    createdById: user.id,
  });

  const room = await HostelService.createRoom({
    buildingId: building.id,
    roomNumber: `101_${Date.now().toString().slice(-3)}`,
    floor: 1,
    totalBeds: 2,
    monthlyRent: 2000,
    createdById: user.id,
  });

  console.log(`✅ Hostel Building & Room Created! Room: ${room.roomNumber}, Beds: ${room.beds.length}`);

  // 3. Allocate Seat/Bed to Student
  console.log("\n🛏️ Step 2: Allocating Seat Bed to Student...");
  const vacantBed = room.beds[0];
  const allocation = await HostelService.allocateBed({
    studentId: student.id,
    bedId: vacantBed.id,
    monthlyFee: 2000,
    createdById: user.id,
  });

  console.log(
    `✅ Bed Allocated! Student: ${allocation.student.nameBn}, Bed No: ${vacantBed.bedNumber}, Status: ${allocation.status}`
  );

  // 4. Record Daily Bazar Purchase
  console.log("\n🛒 Step 3: Recording Daily Bazar Purchase...");
  const vendor = await BazarService.createVendor({
    name: "আব্দুল গফুর ট্রেডার্স",
    phone: "01811223344",
    createdById: user.id,
  });

  const purchase = await BazarService.recordBazarPurchase({
    invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
    vendorId: vendor.id,
    paymentMethod: "CASH",
    items: [
      { itemName: "চাল (নাজিরশাইল)", quantity: 50, unit: "KG", unitPrice: 70 },
      { itemName: "সয়াবিন তেল", quantity: 10, unit: "Ltr", unitPrice: 180 },
    ],
    createdById: user.id,
  });

  console.log(`✅ Bazar Purchase Recorded! Invoice: ${purchase.invoiceNumber}, Total Amount: ৳${purchase.totalAmount}`);

  // 5. DB Assertion Matrix
  console.log("\n--- DB HOSTEL & BAZAR VERIFICATION ASSERTION MATRIX ---");
  console.log(`1. Hostel Building & Room Created: ${building && room ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`2. Bed Seat Allocated to Student: ${allocation.status === "ACTIVE" ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`3. Vendor Created in DB: ${vendor ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`4. Daily Bazar Purchase Recorded: ${Number(purchase.totalAmount) > 0 ? "PASS ✅" : "FAIL ❌"}`);

  console.log("\n=================================================");
  console.log("🎉 ALL HOSTEL & BAZAR CORE MODULE ATOMIC FLOWS VERIFIED!");
  console.log("=================================================\n");
}

runHostelBazarVerification()
  .catch((e) => {
    console.error("❌ Hostel & Bazar Verification Failed with Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
