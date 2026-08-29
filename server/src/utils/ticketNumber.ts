import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateTicketNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `TKT-${currentYear}-`;

  const tickets = await prisma.ticket.findMany({
    where: {
      ticketNumber: {
        startsWith: prefix,
      },
    },
    select: {
      ticketNumber: true,
    },
  });

  let maxSeq = 0;
  for (const t of tickets) {
    const parts = t.ticketNumber.split('-');
    if (parts.length === 3) {
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSequence = maxSeq + 1;
  const paddedSequence = nextSequence.toString().padStart(6, '0');
  return `${prefix}${paddedSequence}`;
}
