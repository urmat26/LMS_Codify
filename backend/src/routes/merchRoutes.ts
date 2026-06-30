import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import {
  getAllItems,
  createItem,
  updateItem,
  archiveItem,
  reorderItems,
} from '../controllers/merchController';

const router = Router();

router.use(authenticate);
router.use(auditMiddleware);

// Read-only for care, full access for admin
router.get('/merch/items', authorize('admin', 'care'), getAllItems);
router.post('/merch/items', authorize('admin'), createItem);
router.put('/merch/items/:itemId', authorize('admin'), updateItem);
router.delete('/merch/items/:itemId', authorize('admin'), archiveItem);
router.put('/merch/reorder', authorize('admin'), reorderItems);

export default router;
