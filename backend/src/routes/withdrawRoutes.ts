import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, authorize } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import { withdraw, cancelTransaction } from '../controllers/withdrawController';
import { deposit } from '../controllers/depositController';

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Слишком много запросов. Повторите через минуту.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.use(authenticate);
router.use(auditMiddleware);

router.post('/students/:studentId/withdraw', authorize('admin', 'care'), writeLimiter, withdraw);
router.post('/transactions/:transactionId/cancel', authorize('admin', 'care', 'student'), writeLimiter, cancelTransaction);
router.post('/students/:studentId/deposit', authorize('admin'), writeLimiter, deposit);

export default router;
