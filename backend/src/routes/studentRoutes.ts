import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getGroupStudents, getStudentTransactions } from '../controllers/studentController';
import { getAllGroups } from '../controllers/groupController';
import { exportGroupCSV } from '../controllers/exportController';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'care'));

router.get('/groups', getAllGroups);
router.get('/groups/:groupId/students', getGroupStudents);
router.get('/groups/:groupId/export-csv', exportGroupCSV);
router.get('/students/:studentId/transactions', getStudentTransactions);

export default router;
