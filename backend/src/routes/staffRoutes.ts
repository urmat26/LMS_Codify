import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import { getStaffGroupAssignments, assignGroups, getMyGroups } from '../controllers/staffController';

const router = Router();

router.use(authenticate);
router.use(auditMiddleware);

router.get('/admin/staff-groups', authorize('admin'), getStaffGroupAssignments);
router.post('/admin/staff-groups', authorize('admin'), assignGroups);
router.get('/staff/my-groups', authorize('admin', 'care'), getMyGroups);

export default router;
