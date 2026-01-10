import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.incomingLetter.deleteMany();
  await prisma.outgoingLetter.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@arsana.go.id',
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN',
    },
  });
  console.log(`   Created admin: ${adminUser.email}`);

  // Create staff user
  console.log('👤 Creating staff user...');
  const staffPassword = await bcrypt.hash('Staff123!', 10);
  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@arsana.go.id',
      password: staffPassword,
      name: 'Staff Sekretariat',
      role: 'STAFF',
    },
  });
  console.log(`   Created staff: ${staffUser.email}`);

  // Create sample incoming letters
  console.log('📨 Creating sample incoming letters...');
  const incomingLetters = [
    {
      letterNumber: 'SM/001/2024',
      letterDate: new Date('2024-01-15'),
      letterNature: 'BIASA' as const,
      subject: 'Undangan Rapat Koordinasi',
      sender: 'Bappeda Kabupaten Klaten',
      recipient: 'Kepala Dinas',
      processor: 'Sekretariat',
      receivedDate: new Date('2024-01-16'),
      processingMethod: 'SRIKANDI' as const,
      dispositionTarget: 'UMPEG' as const,
      isInvitation: true,
      eventDate: new Date('2024-01-25'),
      eventTime: '09:00',
      eventLocation: 'Ruang Rapat Bappeda Lt. 2',
      userId: adminUser.id,
    },
    {
      letterNumber: 'SM/002/2024',
      letterDate: new Date('2024-01-18'),
      letterNature: 'PENTING' as const,
      subject: 'Permohonan Data Kepegawaian',
      sender: 'BKD Kabupaten Klaten',
      recipient: 'Kepala Dinas',
      processor: 'Sub Bagian Kepegawaian',
      receivedDate: new Date('2024-01-19'),
      processingMethod: 'MANUAL' as const,
      needsFollowUp: true,
      followUpDeadline: new Date('2024-01-26'),
      userId: staffUser.id,
    },
    {
      letterNumber: 'SM/003/2024',
      letterDate: new Date('2024-01-20'),
      letterNature: 'RAHASIA' as const,
      subject: 'Laporan Hasil Audit Internal',
      sender: 'Inspektorat Kabupaten Klaten',
      recipient: 'Kepala Dinas',
      processor: 'Sekretaris',
      receivedDate: new Date('2024-01-21'),
      processingMethod: 'SRIKANDI' as const,
      dispositionTarget: 'KABID' as const,
      userId: adminUser.id,
    },
  ];

  for (const letter of incomingLetters) {
    await prisma.incomingLetter.create({ data: letter });
  }
  console.log(`   Created ${incomingLetters.length} incoming letters`);

  // Create sample outgoing letters
  console.log('📤 Creating sample outgoing letters...');
  const outgoingLetters = [
    {
      createdDate: new Date('2024-01-10'),
      letterDate: new Date('2024-01-10'),
      letterNumber: 'SK/001/2024',
      letterNature: 'BIASA' as const,
      subject: 'Undangan Rapat Bulanan',
      sender: 'Kepala Dinas',
      recipient: 'Seluruh Kepala Bidang',
      processor: 'Sekretariat',
      securityClass: 'BIASA' as const,
      processingMethod: 'MANUAL' as const,
      isInvitation: true,
      eventDate: new Date('2024-01-15'),
      eventTime: '10:00',
      eventLocation: 'Ruang Rapat Dinas Lt. 3',
      serialNumber: 1,
      classificationCode: '005',
      userId: adminUser.id,
    },
    {
      createdDate: new Date('2024-01-12'),
      letterDate: new Date('2024-01-12'),
      letterNumber: 'SK/002/2024',
      letterNature: 'PENTING' as const,
      subject: 'Surat Tugas Bimbingan Teknis',
      sender: 'Kepala Dinas',
      recipient: 'Kepala Bidang Perencanaan',
      processor: 'Sub Bagian Umum',
      securityClass: 'BIASA' as const,
      processingMethod: 'SRIKANDI' as const,
      serialNumber: 2,
      classificationCode: '094',
      userId: staffUser.id,
    },
  ];

  for (const letter of outgoingLetters) {
    await prisma.outgoingLetter.create({ data: letter });
  }
  console.log(`   Created ${outgoingLetters.length} outgoing letters`);

  // Create calendar events
  console.log('📅 Creating calendar events...');
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);

  const calendarEvents = [
    {
      title: 'Rapat Koordinasi Bappeda',
      description: 'Rapat koordinasi perencanaan tahunan',
      date: nextWeek,
      time: '09:00',
      location: 'Ruang Rapat Bappeda Lt. 2',
      type: 'MEETING' as const,
      userId: adminUser.id,
    },
    {
      title: 'Deadline Pengumpulan Laporan',
      description: 'Batas waktu pengumpulan laporan bulanan',
      date: inThreeDays,
      time: '17:00',
      type: 'DEADLINE' as const,
      userId: staffUser.id,
    },
  ];

  for (const event of calendarEvents) {
    await prisma.calendarEvent.create({ data: event });
  }
  console.log(`   Created ${calendarEvents.length} calendar events`);

  // Create sample notifications
  console.log('🔔 Creating sample notifications...');
  const notifications = [
    {
      title: 'Selamat Datang di ARSANA',
      message: 'Sistem arsip digital siap digunakan. Silakan mulai mengelola surat masuk dan keluar.',
      type: 'SUCCESS' as const,
      userId: adminUser.id,
    },
    {
      title: 'Pengingat: Rapat Koordinasi',
      message: 'Rapat koordinasi akan dilaksanakan minggu depan. Mohon persiapkan dokumen yang diperlukan.',
      type: 'INFO' as const,
      userId: adminUser.id,
    },
    {
      title: 'Tindak Lanjut Surat',
      message: 'Terdapat 1 surat yang memerlukan tindak lanjut segera.',
      type: 'WARNING' as const,
      userId: staffUser.id,
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.create({ data: notification });
  }
  console.log(`   Created ${notifications.length} notifications`);

  console.log('');
  console.log('✅ Database seeding completed!');
  console.log('');
  console.log('📋 Test accounts:');
  console.log('   Admin: admin@arsana.go.id / Admin123!');
  console.log('   Staff: staff@arsana.go.id / Staff123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
