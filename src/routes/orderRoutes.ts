import { Router } from 'express';
import * as orderController from '../controllers/OrderController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Ruta para que un cliente obtenga sus propios pedidos
router.get('/my-orders', authMiddleware, orderController.getMyOrders);

// Rutas existentes (CRUD general de pedidos, la de abajo es más para admin)
router.get('/', authMiddleware, orderController.getAllOrders); // Podría ser solo para admin
router.get('/:id', authMiddleware, orderController.getOrderById);
router.post('/', authMiddleware, orderController.createOrder); // Este es el endpoint de "checkout"
router.put('/:id', authMiddleware, orderController.updateOrder); // Para admin actualizar estado, etc.
router.delete('/:id', authMiddleware, orderController.deleteOrder); // Para admin

export default router;