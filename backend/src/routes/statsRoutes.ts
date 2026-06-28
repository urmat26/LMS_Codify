import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getTodayStats } from '../controllers/statsController';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'care'));

router.get('/stats/today', getTodayStats);

export default router;
