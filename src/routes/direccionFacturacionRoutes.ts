import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  getDireccionesFacturacion,
  createDireccionFacturacion,
  updateDireccionFacturacion,
  deleteDireccionFacturacion,
  getDireccionFacturacionById
} from '../controllers/DireccionFacturacionController';

const router = Router();

// Todas las rutas aquí requieren autenticación de cliente
router.use(authMiddleware); // Asegura que el usuario esté autenticado para todas las rutas de direcciones

// GET /api/direcciones-facturacion - Obtener todas las direcciones del cliente autenticado
router.get('/', getDireccionesFacturacion);

// POST /api/direcciones-facturacion - Crear una nueva dirección para el cliente autenticado
router.post('/', createDireccionFacturacion);

// GET /api/direcciones-facturacion/:direccionId - Obtener una dirección específica del cliente autenticado
router.get('/:direccionId', getDireccionFacturacionById);

// PUT /api/direcciones-facturacion/:direccionId - Actualizar una dirección específica del cliente autenticado
router.put('/:direccionId', updateDireccionFacturacion);

// DELETE /api/direcciones-facturacion/:direccionId - Eliminar una dirección específica del cliente autenticado
router.delete('/:direccionId', deleteDireccionFacturacion);

export default router;
