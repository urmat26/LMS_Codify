import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import { getAllGroups } from '../controllers/groupController';
import { getGroupStudents, getStudentTransactions, searchStudents } from '../controllers/studentController';
import { exportGroupCSV } from '../controllers/exportController';

const router = Router();

router.use(authenticate);
router.use(auditMiddleware);

router.get('/groups', authorize('admin', 'care'), getAllGroups);
router.get('/groups/:groupId/students', authorize('admin', 'care'), getGroupStudents);
router.get('/groups/:groupId/export-csv', authorize('admin', 'care'), exportGroupCSV);
router.get('/students/search', authorize('admin', 'care'), searchStudents);
router.get('/students/:studentId/transactions', authorize('admin', 'care'), getStudentTransactions);

export default router;
