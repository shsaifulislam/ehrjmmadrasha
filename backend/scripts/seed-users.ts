import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

async function seedTestUsers() {
  console.log('🌱 Seeding test users (Admin, Teacher, Student)...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Ensure Roles exist
  const roles = ['ADMIN', 'TEACHER', 'STUDENT'];
  for (const roleName of roles) {
    const existing = await prisma.role.findFirst({ where: { name: roleName } });
    if (!existing) {
      await prisma.role.create({ data: { name: roleName, description: `${roleName} Role` } });
    }
  }

  const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
  const teacherRole = await prisma.role.findFirst({ where: { name: 'TEACHER' } });
  const studentRole = await prisma.role.findFirst({ where: { name: 'STUDENT' } });

  if (!adminRole || !teacherRole || !studentRole) {
    console.error('Roles not found');
    return;
  }

  // Admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash },
    create: {
      username: 'admin',
      passwordHash,
      roleId: adminRole.id,
      isActive: true
    }
  });

  // Teacher
  const teacherUser = await prisma.user.upsert({
    where: { username: 'teacher' },
    update: { passwordHash },
    create: {
      username: 'teacher',
      passwordHash,
      roleId: teacherRole.id,
      isActive: true
    }
  });

  await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      teacherId: 'T1001',
      nameBn: 'টেস্ট শিক্ষক',
      phone: '01700000001'
    }
  });

  // Student
  const session = await prisma.session.findFirst() || await prisma.session.create({ data: { year: '2026', isActive: true } });
  const cls = await prisma.class.findFirst();

  if (!cls) {
    console.error('No class found, please run main seed first');
    return;
  }

  const studentUser = await prisma.user.upsert({
    where: { username: 'student' },
    update: { passwordHash },
    create: {
      username: 'student',
      passwordHash,
      roleId: studentRole.id,
      isActive: true
    }
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      studentId: 'S2026999',
      roll: 999,
      nameBn: 'টেস্ট শিক্ষার্থী',
      classId: cls.id,
      sessionId: session.id
    }
  });

  console.log('✅ Test users seeded successfully!');
  console.log('Credentials (Username / Password):');
  console.log('- admin / password123');
  console.log('- teacher / password123');
  console.log('- student / password123');
}

seedTestUsers()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
