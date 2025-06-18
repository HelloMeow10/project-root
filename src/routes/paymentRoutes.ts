import { Router } from 'express';
import { processPayment } from '../controllers/PaymentController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
router.post('/', authMiddleware, processPayment);

export default router;