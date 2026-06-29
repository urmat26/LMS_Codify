import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import {
  purchase,
  getMyPurchases,
  getAllPurchases,
  collectPurchase,
  getMerchCatalog,
} from '../controllers/purchaseController';

const router = Router();

router.use(authenticate);
router.use(auditMiddleware);

// Student-facing shop
router.get('/merch/catalog', authorize('admin', 'care', 'student'), getMerchCatalog);
router.post('/merch/purchase', authorize('student'), purchase);
router.get('/purchases', authorize('admin', 'care', 'student'), getMyPurchases);

// Staff-only
router.get('/admin/purchases', authorize('admin', 'care'), getAllPurchases);
router.put('/purchases/:purchaseId/collect', authorize('admin', 'care'), collectPurchase);

export default router;
