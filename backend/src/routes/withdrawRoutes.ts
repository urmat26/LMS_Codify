import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { withdraw, reverseTransaction } from '../controllers/withdrawController';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'care'));

router.post('/students/:studentId/withdraw', withdraw);
router.post('/transactions/:transactionId/reverse', reverseTransaction);

export default router;
