import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getAuditLogs } from '../controllers/auditController';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/admin/audit', getAuditLogs);

export default router;
