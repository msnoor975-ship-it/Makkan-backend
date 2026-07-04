const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash passwords
  const managerPassword = await bcrypt.hash('manager123', 10);
  const salesPassword = await bcrypt.hash('sales123', 10);
  const rentalPassword = await bcrypt.hash('rental123', 10);
  const secretaryPassword = await bcrypt.hash('secretary123', 10);

  // Create users
  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      passwordHash: managerPassword,
      role: 'manager',
      fullName: 'System Manager',
    },
  });

  const salesEmployee = await prisma.user.upsert({
    where: { username: 'sales_employee' },
    update: {},
    create: {
      username: 'sales_employee',
      passwordHash: salesPassword,
      role: 'sales_employee',
      fullName: 'Sales Employee',
    },
  });

  const rentalEmployee = await prisma.user.upsert({
    where: { username: 'rental_employee' },
    update: {},
    create: {
      username: 'rental_employee',
      passwordHash: rentalPassword,
      role: 'rental_employee',
      fullName: 'Rental Employee',
    },
  });

  const secretary = await prisma.user.upsert({
    where: { username: 'secretary' },
    update: {},
    create: {
      username: 'secretary',
      passwordHash: secretaryPassword,
      role: 'secretary',
      fullName: 'Secretary',
    },
  });

  console.log('✅ Created users');

  // Create homeowners
  const homeowner1 = await prisma.homeowner.upsert({
    where: { id: 'homeowner-1' },
    update: {},
    create: {
      id: 'homeowner-1',
      fullName: 'Ahmed Al-Sayed',
      phone: '+966501234567',
      addedByUserId: manager.id,
    },
  });

  const homeowner2 = await prisma.homeowner.upsert({
    where: { id: 'homeowner-2' },
    update: {},
    create: {
      id: 'homeowner-2',
      fullName: 'Fatima Hassan',
      phone: '+966509876543',
      addedByUserId: manager.id,
    },
  });

  const homeowner3 = await prisma.homeowner.upsert({
    where: { id: 'homeowner-3' },
    update: {},
    create: {
      id: 'homeowner-3',
      fullName: 'Mohammed Al-Otaibi',
      phone: '+966505555555',
      addedByUserId: salesEmployee.id,
    },
  });

  console.log('✅ Created homeowners');

  // Create houses
  const house1 = await prisma.house.upsert({
    where: { id: 'house-1' },
    update: {},
    create: {
      id: 'house-1',
      address: '123 Olaya Street, Riyadh',
      specifications: '4 bedrooms, 3 bathrooms, 250 sqm, parking, AC',
      price: 1500000,
      listingType: 'sale',
      status: 'available',
      homeownerId: homeowner1.id,
      addedByUserId: salesEmployee.id,
      imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    },
  });

  const house2 = await prisma.house.upsert({
    where: { id: 'house-2' },
    update: {},
    create: {
      id: 'house-2',
      address: '456 King Fahd Road, Riyadh',
      specifications: '3 bedrooms, 2 bathrooms, 180 sqm, parking',
      price: 25000,
      listingType: 'rent',
      status: 'available',
      homeownerId: homeowner2.id,
      addedByUserId: salesEmployee.id,
      imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    },
  });

  const house3 = await prisma.house.upsert({
    where: { id: 'house-3' },
    update: {},
    create: {
      id: 'house-3',
      address: '789 Al-Malaz, Riyadh',
      specifications: '5 bedrooms, 4 bathrooms, 350 sqm, garden, parking',
      price: 2200000,
      listingType: 'sale',
      status: 'available',
      homeownerId: homeowner3.id,
      addedByUserId: salesEmployee.id,
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    },
  });

  const house4 = await prisma.house.upsert({
    where: { id: 'house-4' },
    update: {},
    create: {
      id: 'house-4',
      address: '321 Anas Bin Malik, Riyadh',
      specifications: '2 bedrooms, 1 bathroom, 100 sqm',
      price: 18000,
      listingType: 'rent',
      status: 'available',
      homeownerId: homeowner1.id,
      addedByUserId: rentalEmployee.id,
      imageUrl: 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800&q=80',
    },
  });

  const house5 = await prisma.house.upsert({
    where: { id: 'house-5' },
    update: {},
    create: {
      id: 'house-5',
      address: '654 Al-Nakheel, Riyadh',
      specifications: '3 bedrooms, 2 bathrooms, 150 sqm, parking',
      price: 850000,
      listingType: 'sale',
      status: 'reserved',
      homeownerId: homeowner2.id,
      addedByUserId: salesEmployee.id,
      imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    },
  });

  console.log('✅ Created houses');

  // Create customers
  const customer1 = await prisma.customer.upsert({
    where: { id: 'customer-1' },
    update: {},
    create: {
      id: 'customer-1',
      fullName: 'Khalid Al-Rashid',
      phone: '+966511111111',
      email: 'khalid@example.com',
      status: 'active',
      addedByUserId: salesEmployee.id,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'customer-2' },
    update: {},
    create: {
      id: 'customer-2',
      fullName: 'Noura Al-Qahtani',
      phone: '+966522222222',
      email: 'noura@example.com',
      status: 'active',
      addedByUserId: salesEmployee.id,
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { id: 'customer-3' },
    update: {},
    create: {
      id: 'customer-3',
      fullName: 'Abdullah Al-Dossary',
      phone: '+966533333333',
      email: 'abdullah@example.com',
      status: 'inactive',
      addedByUserId: rentalEmployee.id,
    },
  });

  console.log('✅ Created customers');

  // Create reservations
  const reservation1 = await prisma.reservation.upsert({
    where: { id: 'reservation-1' },
    update: {},
    create: {
      id: 'reservation-1',
      customerId: customer1.id,
      houseId: house5.id,
      handledByUserId: salesEmployee.id,
      reservationDate: new Date('2026-06-15'),
      status: 'pending',
    },
  });

  const reservation2 = await prisma.reservation.upsert({
    where: { id: 'reservation-2' },
    update: {},
    create: {
      id: 'reservation-2',
      customerId: customer2.id,
      houseId: house2.id,
      handledByUserId: rentalEmployee.id,
      reservationDate: new Date('2026-06-20'),
      status: 'confirmed',
    },
  });

  console.log('✅ Created reservations');

  // Create financial entries
  const financial1 = await prisma.financialAccount.upsert({
    where: { id: 'financial-1' },
    update: {},
    create: {
      id: 'financial-1',
      category: 'income',
      amount: 50000,
      description: 'Commission from house sale',
      entryDate: new Date('2026-06-10'),
      recordedByUserId: secretary.id,
    },
  });

  const financial2 = await prisma.financialAccount.upsert({
    where: { id: 'financial-2' },
    update: {},
    create: {
      id: 'financial-2',
      category: 'expense',
      amount: 5000,
      description: 'Office rent payment',
      entryDate: new Date('2026-06-15'),
      recordedByUserId: secretary.id,
    },
  });

  const financial3 = await prisma.financialAccount.upsert({
    where: { id: 'financial-3' },
    update: {},
    create: {
      id: 'financial-3',
      category: 'income',
      amount: 25000,
      description: 'Rental commission',
      entryDate: new Date('2026-06-20'),
      recordedByUserId: secretary.id,
    },
  });

  console.log('✅ Created financial entries');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Manager:       username: manager,       password: manager123');
  console.log('Sales:         username: sales_employee, password: sales123');
  console.log('Rental:        username: rental_employee,password: rental123');
  console.log('Secretary:     username: secretary,      password: secretary123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
