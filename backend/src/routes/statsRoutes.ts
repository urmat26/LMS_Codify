import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getTodayStats } from '../controllers/statsController';

const router = Router();

router.use(authenticate);

router.get('/stats/today', authorize('admin', 'care'), getTodayStats);

export default router;
