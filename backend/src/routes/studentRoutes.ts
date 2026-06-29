import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import { getAllGroups } from '../controllers/groupController';
import { getGroupStudents, getStudentTransactions } from '../controllers/studentController';
import { exportGroupCSV } from '../controllers/exportController';

const router = Router();

router.use(authenticate);
router.use(auditMiddleware);
router.use(authorize('admin', 'care'));

router.get('/groups', getAllGroups);
router.get('/groups/:groupId/students', getGroupStudents);
router.get('/groups/:groupId/export-csv', exportGroupCSV);
router.get('/students/:studentId/transactions', getStudentTransactions);

export default router;
