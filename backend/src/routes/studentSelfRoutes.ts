import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getMyProfile, getMyTransactions } from '../controllers/studentSelfController';

const router = Router();

router.use(authenticate);

router.get('/students/me', authorize('student'), getMyProfile);
router.get('/students/me/transactions', authorize('student'), getMyTransactions);

export default router;
