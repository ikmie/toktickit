import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Categories
  const categories = [
    { id: 1, name: 'Account and Access' },
    { id: 2, name: 'Hardware' },
    { id: 3, name: 'Software' },
    { id: 4, name: 'Network' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name },
      create: cat,
    });
  }

  // 2. Seed Related Systems
  const relatedSystems = [
    { id: 1, name: 'Email', code: 'EMAIL', isActive: true },
    { id: 2, name: 'Campus Wi-Fi', code: 'WIFI', isActive: true },
    { id: 3, name: 'VPN', code: 'VPN', isActive: true },
    { id: 4, name: 'LEB2 App', code: 'LEB2', isActive: true },
    { id: 5, name: 'Grade Submission App', code: 'GRADE', isActive: true },
    { id: 6, name: 'Printer', code: 'PRINTER', isActive: true },
    { id: 7, name: 'Corporate Laptop', code: 'LAPTOP', isActive: true },
  ];

  for (const sys of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { id: sys.id },
      update: { name: sys.name, code: sys.code, isActive: sys.isActive },
      create: sys,
    });
  }

  // 3. Seed Development Requesters
  const requesters = [
    {
      id: 1,
      name: 'Supanut Sopha',
      email: 'supanut.soph@kmutt.ac.th',
      department: 'Computer Engineering',
      isActive: true,
    },
    {
      id: 2,
      name: 'Ikmie ikumii',
      email: 'ikumii.team@kmutt.ac.th',
      department: 'IT Support',
      isActive: true,
    },
    {
      id: 3,
      name: 'Wichitchai Suwanno',
      email: 'wichitchai.suwa@kmutt.ac.th',
      department: 'Computer Engineering',
      isActive: true,
    },
    {
      id: 4,
      name: 'Zeleng Zuling',
      email: 'Yar.Zeleng@kmutt.ac.th',
      department: 'Mechanical Engineering',
      isActive: true,
    },
    {
      id: 5,
      name: 'Mai wai laeww',
      email: 'mwl@kmutt.ac.th',
      department: 'Civil Engineering',
      isActive: false,
    },
  ];

  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { id: req.id },
      update: {
        name: req.name,
        email: req.email,
        department: req.department,
        isActive: req.isActive,
      },
      create: req,
    });
  }

  // 4. Seed Initial Tickets for Testing Context
  const existingTickets = await prisma.ticket.count();
  if (existingTickets === 0) {
    await prisma.ticket.create({
      data: {
        ticketNumber: 'TKT-2026-000101',
        requesterId: 1, // Jennifer Anderson
        categoryId: 2, // Hardware
        relatedSystemId: 7, // Corporate Laptop
        summary: 'Laptop battery drains quickly',
        description:
          'My laptop battery is draining much faster than usual even when the system is idle. This started happening after last week\'s Windows update.',
        requestedPriority: 'MEDIUM',
        itPriority: 'MEDIUM',
        currentStatus: 'IN_PROGRESS',
        ticketDate: new Date('2026-08-12T09:14:00Z'),
        attachments: {
          create: [
            {
              filename: 'attachment-1-battery-diag.pdf',
              originalName: 'battery_diagnostics.pdf',
              mimeType: 'application/pdf',
              fileSize: 450120,
              storagePath: 'uploads/attachment-1-battery-diag.pdf',
              isRemoved: false,
            },
            {
              filename: 'attachment-2-old-log.png',
              originalName: 'system_log.png',
              mimeType: 'image/png',
              fileSize: 180300,
              storagePath: 'uploads/attachment-2-old-log.png',
              isRemoved: true,
              removedAt: new Date('2026-08-13T10:00:00Z'),
              removedReason: 'Uploaded wrong screenshot by mistake',
            },
          ],
        },
      },
    });

    await prisma.ticket.create({
      data: {
        ticketNumber: 'TKT-2026-000102',
        requesterId: 1, // Jennifer Anderson
        categoryId: 4, // Network
        relatedSystemId: 3, // VPN
        summary: 'Cannot connect to VPN from home network',
        description:
          'Receiving authentication timeout error when establishing connection to campus VPN server.',
        requestedPriority: 'HIGH',
        itPriority: 'HIGH',
        currentStatus: 'OPEN',
        ticketDate: new Date('2026-08-15T11:30:00Z'),
      },
    });

    await prisma.ticket.create({
      data: {
        ticketNumber: 'TKT-2026-000103',
        requesterId: 2, // Michael Brown
        categoryId: 1, // Account and Access
        relatedSystemId: 4, // LEB2 App
        summary: 'New employee LEB2 course access setup',
        description:
          'Need instructor permission granted for course CPE334 on LEB2 app platform.',
        requestedPriority: 'LOW',
        itPriority: 'LOW',
        currentStatus: 'RESOLVED',
        ticketDate: new Date('2026-08-16T14:20:00Z'),
      },
    });
  }

  console.log('Lab 2 database seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
