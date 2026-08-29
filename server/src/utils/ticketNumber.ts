import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateTicketNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `TKT-${currentYear}-`;

  // Find highest existing ticket number for current year
  const latestTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      ticketNumber: 'desc',
    },
  });

  let nextSequence = 1;
  if (latestTicket) {
    const parts = latestTicket.ticketNumber.split('-');
    if (parts.length === 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  }

  const paddedSequence = nextSequence.toString().padStart(6, '0');
  return `${prefix}${paddedSequence}`;
}
