import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getCart, addToCart, clearCart, updateCartItem, removeCartItem } from '../controllers/CartController';

const router = Router();

router.get('/', authMiddleware, getCart); // GET /api/cart
router.post('/', authMiddleware, addToCart); // POST /api/cart
router.delete('/', authMiddleware, clearCart); // DELETE /api/cart
router.patch('/item/:id', authMiddleware, updateCartItem); // PATCH /api/cart/item/:id
router.delete('/item/:id', authMiddleware, removeCartItem); // DELETE /api/cart/item/:id

export default router;