// src/routes/productRoutes.ts
import { Router } from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/ProductController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Rutas públicas (ejemplo: cualquiera puede ver productos)
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Rutas protegidas por JWT (solo usuarios autenticados pueden crear, actualizar, eliminar)
router.post('/', authMiddleware, createProduct);
router.put('/:id', authMiddleware, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);

export default router;
