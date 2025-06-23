import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getCart, addToCart, clearCart, updateCartItem, removeCartItem } from '../controllers/CartController';

const router = Router();

router.get('/', authMiddleware, getCart); // GET /api/cart
router.post('/', authMiddleware, addToCart); // POST /api/cart
router.put('/item/:itemId', authMiddleware, updateCartItem); // PUT /api/cart/item/:itemId
router.delete('/item/:itemId', authMiddleware, removeCartItem); // DELETE /api/cart/item/:itemId
router.delete('/', authMiddleware, clearCart); // DELETE /api/cart (vaciar todo el carrito)

export default router;