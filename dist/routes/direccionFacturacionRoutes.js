"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const DireccionFacturacionController_1 = require("../controllers/DireccionFacturacionController");
const router = (0, express_1.Router)();
// Todas las rutas aquí requieren autenticación de cliente
router.use(authMiddleware_1.authMiddleware); // Asegura que el usuario esté autenticado para todas las rutas de direcciones
// GET /api/direcciones-facturacion - Obtener todas las direcciones del cliente autenticado
router.get('/', DireccionFacturacionController_1.getDireccionesFacturacion);
// POST /api/direcciones-facturacion - Crear una nueva dirección para el cliente autenticado
router.post('/', DireccionFacturacionController_1.createDireccionFacturacion);
// GET /api/direcciones-facturacion/:direccionId - Obtener una dirección específica del cliente autenticado
router.get('/:direccionId', DireccionFacturacionController_1.getDireccionFacturacionById);
// PUT /api/direcciones-facturacion/:direccionId - Actualizar una dirección específica del cliente autenticado
router.put('/:direccionId', DireccionFacturacionController_1.updateDireccionFacturacion);
// DELETE /api/direcciones-facturacion/:direccionId - Eliminar una dirección específica del cliente autenticado
router.delete('/:direccionId', DireccionFacturacionController_1.deleteDireccionFacturacion);
exports.default = router;
