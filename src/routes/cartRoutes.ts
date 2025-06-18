import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getCart, addToCart, clearCart } from '../controllers/CartController';

const router = Router();

router.get('/', authMiddleware, getCart); // GET /api/cart
router.post('/', authMiddleware, addToCart); // POST /api/cart
router.delete('/', authMiddleware, clearCart); // DELETE /api/cart

export default router;