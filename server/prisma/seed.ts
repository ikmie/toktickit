import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);
  const initialPasswordHash = bcrypt.hashSync('Initial123!', 10);

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

  // 3. Seed Users (Requesters, IT Staff, Administrators)
  const users = [
    // Requesters (Active >= 4, Inactive >= 1)
    {
      id: 1,
      name: 'Supanut Sopha',
      email: 'supanut.soph@kmutt.ac.th',
      passwordHash: defaultPasswordHash,
      role: 'REQUESTER',
      department: 'Computer Engineering',
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 2,
      name: 'Ikmie ikumii',
      email: 'ikumii.team@kmutt.ac.th',
      passwordHash: defaultPasswordHash,
      role: 'REQUESTER',
      department: 'IT Support',
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 3,
      name: 'Wichitchai Suwanno',
      email: 'wichitchai.suwa@kmutt.ac.th',
      passwordHash: defaultPasswordHash,
      role: 'REQUESTER',
      department: 'Computer Engineering',
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 4,
      name: 'Zeleng Zuling',
      email: 'Yar.Zeleng@kmutt.ac.th',
      passwordHash: defaultPasswordHash,
      role: 'REQUESTER',
      department: 'Mechanical Engineering',
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 5,
      name: 'Jennifer Anderson',
      email: 'jennifer.a@kmutt.ac.th',
      passwordHash: defaultPasswordHash,
      role: 'REQUESTER',
      department: 'Faculty of Science',
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 6,
      name: 'Mai wai laeww',
      email: 'mwl@kmutt.ac.th',
      passwordHash: defaultPasswordHash,
      role: 'REQUESTER',
      department: 'Civil Engineering',
      isActive: false,
      mustChangePassword: false,
    },

    // IT Staff (Active >= 3, Inactive >= 1, First-login user)
    {
      id: 7,
      name: 'Michael Brown',
      email: 'michael.b@toktickit.com',
      passwordHash: defaultPasswordHash,
      role: 'IT_STAFF',
      department: 'IT Operations',
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 8,
      name: 'Sarah Johnson',
      email: 'sarah.j@toktickit.com',
      passwordHash: defaultPasswordHash,
      role: 'IT_STAFF',
      department: 'Network Operations',
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 9,
      name: 'David Lee',
      email: 'david.l@toktickit.com',
      passwordHash: defaultPasswordHash,
      role: 'IT_STAFF',
      department: 'Desktop Support',
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 10,
      name: 'Alex Thompson',
      email: 'alex.t@toktickit.com',
      passwordHash: initialPasswordHash,
      role: 'IT_STAFF',
      department: 'Systems Support',
      isActive: true,
      mustChangePassword: true, // For testing first login password change flow
    },
    {
      id: 11,
      name: 'Kevin Patel',
      email: 'kevin.p@toktickit.com',
      passwordHash: defaultPasswordHash,
      role: 'IT_STAFF',
      department: 'IT Infrastructure',
      isActive: false,
      mustChangePassword: false,
    },

    // Administrators (Active >= 1, 2 provided for safety testing)
    {
      id: 12,
      name: 'Admin User',
      email: 'admin@toktickit.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      department: 'IT Administration',
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: 13,
      name: 'System Administrator',
      email: 'sysadmin@toktickit.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      department: 'System Architecture',
      isActive: true,
      mustChangePassword: false,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        department: u.department,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
      },
      create: u,
    });
  }

  // 4. Seed Realistic Tickets with Attachments, Comments, and Internal Notes
  const ticketsData = [
    {
      id: 1,
      ticketNumber: 'TKT-2026-000101',
      requesterId: 1, // Supanut
      ownerId: 7, // Michael Brown
      categoryId: 2, // Hardware
      relatedSystemId: 7, // Corporate Laptop
      summary: 'Laptop battery drains quickly',
      description:
        'My laptop battery is draining much faster than usual even when the system is idle. This started happening after last week Windows update.',
      requestedPriority: 'MEDIUM',
      itPriority: 'MEDIUM',
      currentStatus: 'IN_PROGRESS',
      problemResolvedIndicated: false,
      ticketDate: new Date('2026-08-12T09:14:00Z'),
      attachments: [
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
      comments: [
        {
          authorId: 7, // Michael Brown (IT Staff)
          content: 'Hello, we are investigating your battery diagnostic report. Please ensure BIOS is up to date.',
          createdAt: new Date('2026-08-12T10:30:00Z'),
        },
        {
          authorId: 1, // Supanut (Requester)
          content: 'Thank you for the update. I verified BIOS is current. Let me know if you need more logs.',
          createdAt: new Date('2026-08-12T11:45:00Z'),
        },
      ],
      notes: [
        {
          authorId: 7, // Michael Brown (IT Staff)
          content: 'Telemetry reveals background telemetry service spooler bug from latest OEM patch release.',
          createdAt: new Date('2026-08-12T10:35:00Z'),
        },
      ],
      actions: [
        {
          id: 1,
          actionDateTime: new Date('2026-08-12T10:15:00Z'),
          description: 'Conducted hardware diagnostic test and inspected battery discharge rates.',
          result: 'Battery wear level measured at 38%; background power drain identified in OEM battery monitor.',
          performedById: 7, // Michael Brown (Ticket Owner)
          followUpRequired: true,
          followUpNote: 'Apply firmware update KB449210 and monitor discharge overnight.',
          attachmentNotes: 'attachment-1-battery-diag.pdf',
        },
        {
          id: 2,
          actionDateTime: new Date('2026-08-13T09:00:00Z'),
          description: 'Applied OEM BIOS firmware update to version 1.14 and calibrated power regulator.',
          result: 'Discharge rate stabilized at 6% per hour under typical workload.',
          performedById: 9, // David Lee (Different IT Staff than owner Michael Brown - tests BR-02)
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      ],
    },
    {
      id: 2,
      ticketNumber: 'TKT-2026-000102',
      requesterId: 1, // Supanut
      ownerId: 8, // Sarah Johnson
      categoryId: 4, // Network
      relatedSystemId: 3, // VPN
      summary: 'Cannot connect to VPN from home network',
      description:
        'Receiving authentication timeout error when establishing connection to campus VPN server.',
      requestedPriority: 'HIGH',
      itPriority: 'HIGH',
      currentStatus: 'OPEN',
      problemResolvedIndicated: false,
      ticketDate: new Date('2026-08-15T11:30:00Z'),
      attachments: [],
      comments: [
        {
          authorId: 8, // Sarah Johnson
          content: 'Checking gateway logs for your client certificate handshake.',
          createdAt: new Date('2026-08-15T11:40:00Z'),
        },
      ],
      notes: [
        {
          authorId: 8,
          content: 'Secondary authentication radius pool had minor latency spike.',
          createdAt: new Date('2026-08-15T11:42:00Z'),
        },
      ],
      actions: [
        {
          id: 3,
          actionDateTime: new Date('2026-08-15T11:45:00Z'),
          description: 'Inspected RADIUS server auth gateway logs and re-issued client TLS certificate.',
          result: 'Client certificate re-synchronized with KMUTT active directory.',
          performedById: 8, // Sarah Johnson
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      ],
    },
    {
      id: 3,
      ticketNumber: 'TKT-2026-000103',
      requesterId: 2, // Ikmie
      ownerId: 9, // David Lee
      categoryId: 1, // Account and Access
      relatedSystemId: 4, // LEB2 App
      summary: 'New employee LEB2 course access setup',
      description:
        'Need instructor permission granted for course CPE334 on LEB2 app platform.',
      requestedPriority: 'LOW',
      itPriority: 'LOW',
      currentStatus: 'RESOLVED',
      problemResolvedIndicated: true,
      resolutionSummary: 'Instructor access provisioned on LEB2 course shell CPE334.',
      ticketDate: new Date('2026-08-16T14:20:00Z'),
      attachments: [],
      comments: [
        {
          authorId: 9,
          content: 'Permissions granted. Please verify access on leb2.kmutt.ac.th.',
          createdAt: new Date('2026-08-16T15:00:00Z'),
        },
        {
          authorId: 2,
          content: 'Confirmed, course shell is now visible on dashboard. Thanks!',
          createdAt: new Date('2026-08-16T15:10:00Z'),
        },
      ],
      notes: [
        {
          authorId: 9,
          content: 'Assigned role Teacher Assistant in section 1.',
          createdAt: new Date('2026-08-16T14:55:00Z'),
        },
      ],
      actions: [
        {
          id: 4,
          actionDateTime: new Date('2026-08-16T14:45:00Z'),
          description: 'Configured role-based access control permissions on LEB2 database for course CPE334.',
          result: 'Teacher Assistant permissions successfully provisioned.',
          performedById: 9, // David Lee
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      ],
    },
    {
      id: 4,
      ticketNumber: 'TKT-2026-000104',
      requesterId: 3, // Wichitchai
      ownerId: null, // Unassigned
      categoryId: 2, // Hardware
      relatedSystemId: 6, // Printer
      summary: 'Department printer keeps showing offline',
      description:
        'The shared HP LaserJet printer on 4th floor engineering building does not wake up from sleep mode.',
      requestedPriority: 'MEDIUM',
      itPriority: 'LOW',
      currentStatus: 'NEW',
      problemResolvedIndicated: false,
      ticketDate: new Date('2026-08-17T08:15:00Z'),
      attachments: [],
      comments: [],
      notes: [],
      actions: [], // 0 actions - for testing resolution gate block
    },
    {
      id: 5,
      ticketNumber: 'TKT-2026-000105',
      requesterId: 4, // Zeleng
      ownerId: 7, // Michael Brown
      categoryId: 3, // Software
      relatedSystemId: 1, // Email
      summary: 'Outlook desktop freezing intermittently',
      description:
        'Outlook client freezes for 30-60 seconds whenever sending emails with attachments.',
      requestedPriority: 'HIGH',
      itPriority: 'MEDIUM',
      currentStatus: 'WAITING_FOR_REQUESTER',
      problemResolvedIndicated: false,
      ticketDate: new Date('2026-08-18T10:00:00Z'),
      attachments: [],
      comments: [
        {
          authorId: 7,
          content: 'Could you try starting Outlook in safe mode by running outlook.exe /safe and let us know if the issue persists?',
          createdAt: new Date('2026-08-18T11:00:00Z'),
        },
      ],
      notes: [
        {
          authorId: 7,
          content: 'Suspecting corrupt add-in (Antivirus email scanner).',
          createdAt: new Date('2026-08-18T10:50:00Z'),
        },
      ],
      actions: [
        {
          id: 5,
          actionDateTime: new Date('2026-08-18T10:45:00Z'),
          description: 'Analyzed Outlook process crash dumps and disabled malfunctioning 3rd-party antivirus add-in.',
          result: 'Requested user to verify behavior in safe mode.',
          performedById: 7, // Michael Brown
          followUpRequired: true,
          followUpNote: 'Awaiting confirmation from user after 24 hours of normal usage.',
          attachmentNotes: null,
        },
      ],
    },
    {
      id: 6,
      ticketNumber: 'TKT-2026-000106',
      requesterId: 5, // Jennifer
      ownerId: 8, // Sarah Johnson
      categoryId: 4, // Network
      relatedSystemId: 2, // Campus Wi-Fi
      summary: 'Slow Wi-Fi connection in library quiet study hall',
      description:
        'Connection speed drops below 1 Mbps consistently during peak afternoon hours.',
      requestedPriority: 'MEDIUM',
      itPriority: 'HIGH',
      currentStatus: 'CLOSED',
      problemResolvedIndicated: true,
      resolutionSummary: 'Decongestion channel optimization performed on AP-LIB-04.',
      ticketDate: new Date('2026-08-19T13:45:00Z'),
      attachments: [],
      comments: [],
      notes: [],
      actions: [
        {
          id: 6,
          actionDateTime: new Date('2026-08-19T14:00:00Z'),
          description: 'Re-allocated 5GHz Wi-Fi channels on AP-LIB-04 and reduced co-channel interference.',
          result: 'Throughput restored to 85 Mbps across library study hall.',
          performedById: 8, // Sarah Johnson
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
        },
      ],
    },
    {
      id: 7,
      ticketNumber: 'TKT-2026-000107',
      requesterId: 1, // Supanut
      ownerId: null, // Unassigned
      categoryId: 1, // Account and Access
      relatedSystemId: 5, // Grade Submission App
      summary: 'Grade submission portal access expired',
      description:
        'Need semester access reactivated before midterm deadline.',
      requestedPriority: 'URGENT',
      itPriority: 'URGENT',
      currentStatus: 'NEW',
      problemResolvedIndicated: false,
      ticketDate: new Date('2026-08-20T09:00:00Z'),
      attachments: [],
      comments: [],
      notes: [],
      actions: [], // 0 actions - for testing resolution gate block
    },
    {
      id: 8,
      ticketNumber: 'TKT-2026-000108',
      requesterId: 2, // Ikmie
      ownerId: 7, // Michael Brown
      categoryId: 3, // Software
      relatedSystemId: 7, // Corporate Laptop
      summary: 'Software installation request for Docker Desktop',
      description:
        'Require administrator credentials or software portal authorization to install Docker Desktop for lab development.',
      requestedPriority: 'LOW',
      itPriority: 'LOW',
      currentStatus: 'CANCELLED',
      problemResolvedIndicated: false,
      ticketDate: new Date('2026-08-21T15:30:00Z'),
      attachments: [],
      comments: [
        {
          authorId: 7,
          content: 'Duplicate request. Handled under department bulk license deployment.',
          createdAt: new Date('2026-08-21T16:00:00Z'),
        },
      ],
      notes: [],
      actions: [],
    },
    {
      id: 9,
      ticketNumber: 'TKT-2026-000109',
      requesterId: 5, // Jennifer
      ownerId: 7, // Michael Brown
      categoryId: 3, // Software
      relatedSystemId: 1, // Email
      summary: 'Email spam filter blocking legitimate KMUTT announcements',
      description: 'Faculty notices from dean office are being flagged as spam.',
      requestedPriority: 'HIGH',
      itPriority: 'HIGH',
      currentStatus: 'REOPENED',
      problemResolvedIndicated: false,
      ticketDate: new Date('2026-08-22T08:00:00Z'),
      attachments: [],
      comments: [],
      notes: [],
      actions: [
        {
          id: 7,
          actionDateTime: new Date('2026-08-22T08:30:00Z'),
          description: 'Reviewed spam filter false positive rules and whitelisted sender domain.',
          result: 'Rule modified on mail relay.',
          performedById: 7, // Michael Brown
          followUpRequired: true,
          followUpNote: 'Verify next campus newsletter delivery.',
          attachmentNotes: null,
        },
      ],
    },
  ];

  for (const t of ticketsData) {
    const { attachments, comments, notes, actions, ...ticketFields } = t;

    await prisma.ticket.upsert({
      where: { id: ticketFields.id },
      update: {
        ticketNumber: ticketFields.ticketNumber,
        requesterId: ticketFields.requesterId,
        ownerId: ticketFields.ownerId,
        categoryId: ticketFields.categoryId,
        relatedSystemId: ticketFields.relatedSystemId,
        summary: ticketFields.summary,
        description: ticketFields.description,
        requestedPriority: ticketFields.requestedPriority,
        itPriority: ticketFields.itPriority,
        currentStatus: ticketFields.currentStatus,
        problemResolvedIndicated: ticketFields.problemResolvedIndicated,
        resolutionSummary: ticketFields.resolutionSummary,
        ticketDate: ticketFields.ticketDate,
      },
      create: ticketFields,
    });

    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        const existingAtt = await prisma.attachment.findFirst({
          where: { ticketId: ticketFields.id, filename: att.filename },
        });
        if (!existingAtt) {
          await prisma.attachment.create({
            data: {
              ticketId: ticketFields.id,
              ...att,
            },
          });
        }
      }
    }

    if (comments && comments.length > 0) {
      for (const c of comments) {
        const existingComment = await prisma.comment.findFirst({
          where: { ticketId: ticketFields.id, content: c.content },
        });
        if (!existingComment) {
          await prisma.comment.create({
            data: {
              ticketId: ticketFields.id,
              ...c,
            },
          });
        }
      }
    }

    if (notes && notes.length > 0) {
      for (const n of notes) {
        const existingNote = await prisma.internalNote.findFirst({
          where: { ticketId: ticketFields.id, content: n.content },
        });
        if (!existingNote) {
          await prisma.internalNote.create({
            data: {
              ticketId: ticketFields.id,
              ...n,
            },
          });
        }
      }
    }

    if (actions && actions.length > 0) {
      for (const act of actions) {
        await prisma.actionTaken.upsert({
          where: { id: act.id },
          update: {
            ticketId: ticketFields.id,
            actionDateTime: act.actionDateTime,
            description: act.description,
            result: act.result,
            performedById: act.performedById,
            followUpRequired: act.followUpRequired,
            followUpNote: act.followUpNote,
            attachmentNotes: act.attachmentNotes,
          },
          create: {
            id: act.id,
            ticketId: ticketFields.id,
            actionDateTime: act.actionDateTime,
            description: act.description,
            result: act.result,
            performedById: act.performedById,
            followUpRequired: act.followUpRequired,
            followUpNote: act.followUpNote,
            attachmentNotes: act.attachmentNotes,
          },
        });
      }
    }
  }

  console.log('Lab 4 database seed completed successfully with Actions Taken.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
