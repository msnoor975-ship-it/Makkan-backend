const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateAdminToManager() {
  console.log('🔄 Starting migration: Converting admin users to manager...');

  try {
    // Check if there are any users with admin role by checking all users
    const allUsers = await prisma.$queryRaw`
      SELECT username, "fullName", role 
      FROM "User"
    `;

    console.log('Current users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.fullName}) -> role: ${user.role}`);
    });

    // Check if any user has 'admin' in their role field (as a string check)
    const adminUsers = allUsers.filter(user => user.role === 'admin' || user.role?.toString().includes('admin'));

    if (adminUsers.length === 0) {
      console.log('✅ No admin users found in database. Migration not needed.');
      console.log('ℹ️ The database enum may already not include "admin" as a valid value.');
      console.log('ℹ️ Proceeding with schema changes to remove "admin" from the enum.');
      return;
    }

    console.log(`Found ${adminUsers.length} user(s) with admin role`);
    console.log('⚠️ Manual intervention required: Database enum does not recognize "admin" as valid.');
    console.log('⚠️ Please add "admin" back to the UserRole enum temporarily, run this migration, then remove it again.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateAdminToManager()
  .then(() => {
    console.log('✅ Migration check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration check failed:', error);
    process.exit(1);
  });
