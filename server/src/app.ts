import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import requestersRouter from './routes/requesters';
import relatedSystemsRouter from './routes/relatedSystems';
import ticketsRouter from './routes/tickets';
import attachmentsRouter from './routes/attachments';
import authRouter from './routes/auth';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'TokTickIT API' });
});

app.get('/api/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    });
    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/requesters', requestersRouter);
app.use('/api/related-systems', relatedSystemsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api', attachmentsRouter);

export default app;
