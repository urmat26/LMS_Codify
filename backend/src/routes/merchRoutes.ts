import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getCatalog,
  getAllItems,
  createItem,
  updateItem,
  archiveItem,
  reorderItems,
} from '../controllers/merchController';

const router = Router();

router.use(authenticate);

// Read-only for care, full access for admin
router.get('/merch/catalog', authorize('admin', 'care'), getCatalog);
router.get('/merch/items', authorize('admin'), getAllItems);
router.post('/merch/items', authorize('admin'), createItem);
router.put('/merch/items/:itemId', authorize('admin'), updateItem);
router.delete('/merch/items/:itemId', authorize('admin'), archiveItem);
router.put('/merch/reorder', authorize('admin'), reorderItems);

export default router;
