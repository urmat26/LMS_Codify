import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';

function getPort(): string {
  return process.env.PORT || '3001';
}

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Routes (loaded after dotenv.config due to ESM hoisting — env reads happen at call time)
async function start() {
  const authRoutes = (await import('./routes/authRoutes')).default;
  const studentRoutes = (await import('./routes/studentRoutes')).default;
  const merchRoutes = (await import('./routes/merchRoutes')).default;
  const withdrawRoutes = (await import('./routes/withdrawRoutes')).default;
  const statsRoutes = (await import('./routes/statsRoutes')).default;

  app.use('/api', authRoutes);
  app.use('/api', studentRoutes);
  app.use('/api', merchRoutes);
  app.use('/api', withdrawRoutes);
  app.use('/api', statsRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  const port = getPort();
  app.listen(port, () => {
    console.log(`Codify API server running on port ${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
