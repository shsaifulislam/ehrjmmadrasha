import 'dotenv/config';
import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Permissions
  const permissionsData = [
    { name: 'view_dashboard', module: 'DASHBOARD', description: 'Can view admin dashboard' },
    { name: 'view_students', module: 'STUDENTS', description: 'Can view student list' },
    { name: 'manage_students', module: 'STUDENTS', description: 'Can add/edit students' },
    { name: 'view_teachers', module: 'TEACHERS', description: 'Can view teacher list' },
    { name: 'manage_teachers', module: 'TEACHERS', description: 'Can add/edit teachers' },
    { name: 'manage_admissions', module: 'ADMISSIONS', description: 'Can manage admissions' },
    { name: 'manage_attendance', module: 'ATTENDANCE', description: 'Can manage attendance' },
    { name: 'manage_results', module: 'RESULTS', description: 'Can manage exam results' },
    { name: 'manage_finance', module: 'FINANCE', description: 'Can manage invoices and payments' },
    { name: 'manage_notices', module: 'CONTENT', description: 'Can manage notices' },
    { name: 'manage_gallery', module: 'CONTENT', description: 'Can manage gallery' },
    { name: 'manage_downloads', module: 'CONTENT', description: 'Can manage downloads' },
    { name: 'manage_settings', module: 'SYSTEM', description: 'Can manage system settings' },
    { name: 'view_audit_logs', module: 'SYSTEM', description: 'Can view audit logs' },
    { name: 'manage_backup', module: 'SYSTEM', description: 'Can manage database backups' },
  ];

  const createdPermissions: any[] = [];
  for (const perm of permissionsData) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    createdPermissions.push(p);
  }
  console.log(`✅ Created ${createdPermissions.length} permissions.`);

  // 2. Create Roles
  const rolesData = [
    { name: 'ADMIN', description: 'Super Administrator' },
    { name: 'TEACHER', description: 'Teaching Staff' },
    { name: 'STUDENT', description: 'Student' },
    { name: 'STAFF', description: 'General Staff' },
  ];

  const createdRoles: any[] = [];
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
    createdRoles.push(role);
  }
  console.log(`✅ Created ${createdRoles.length} roles.`);

  // 3. Assign all permissions to ADMIN role
  const adminRole = createdRoles.find(r => r.name === 'ADMIN');
  if (adminRole) {
    for (const perm of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id
          }
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: perm.id
        }
      });
    }
    console.log('✅ Assigned all permissions to ADMIN role.');
  }

  // 4. Create Initial Admin User
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } });
  
  if (!existingAdmin && adminRole) {
    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: adminPasswordHash,
        roleId: adminRole.id,
        mustChangePassword: true, // Forces change on first login
        isActive: true,
      }
    });
    console.log('✅ Created default admin user (username: admin, password: admin123).');
  } else {
    console.log('⚠️ Admin user already exists, skipping creation.');
  }

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
