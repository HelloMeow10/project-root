import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getCart, addToCart, clearCart } from '../controllers/CartController';

const router = Router();

router.get('/', authMiddleware, getCart);
router.post('/', authMiddleware, addToCart);
router.delete('/', authMiddleware, clearCart);

export default router;