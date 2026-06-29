import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler';
import { spec } from './openapi';

function getPort(): string {
  return process.env.PORT || '3001';
}

const app = express();

app.use(cors());
app.use(express.json());

// Health check
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
};
app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(spec));

// Routes (loaded after dotenv.config due to ESM hoisting — env reads happen at call time)
async function start() {
  const authRoutes = (await import('./routes/authRoutes')).default;
  const studentRoutes = (await import('./routes/studentRoutes')).default;
  const merchRoutes = (await import('./routes/merchRoutes')).default;
  const withdrawRoutes = (await import('./routes/withdrawRoutes')).default;
  const statsRoutes = (await import('./routes/statsRoutes')).default;
  const purchaseRoutes = (await import('./routes/purchaseRoutes')).default;
  const auditRoutes = (await import('./routes/auditRoutes')).default;
  const staffRoutes = (await import('./routes/staffRoutes')).default;

  app.use('/api', authRoutes);
  app.use('/api/v1', authRoutes);
  app.use('/api', studentRoutes);
  app.use('/api/v1', studentRoutes);
  app.use('/api', merchRoutes);
  app.use('/api/v1', merchRoutes);
  app.use('/api', withdrawRoutes);
  app.use('/api/v1', withdrawRoutes);
  app.use('/api', statsRoutes);
  app.use('/api/v1', statsRoutes);
  app.use('/api', purchaseRoutes);
  app.use('/api/v1', purchaseRoutes);
  app.use('/api', auditRoutes);
  app.use('/api/v1', auditRoutes);
  app.use('/api', staffRoutes);
  app.use('/api/v1', staffRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  const port = getPort();
  const server = app.listen(port, () => {
    console.log(`Codify API server running on port ${port}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close();
    const { prisma } = await import('./utils/prisma');
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
