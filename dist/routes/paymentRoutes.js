"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentController_1 = require("../controllers/PaymentController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Todas las rutas aquí requieren autenticación de cliente
router.use(authMiddleware_1.authMiddleware);
// Procesar un pago para un pedido
router.post('/', PaymentController_1.processPayment);
// Crear un SetupIntent para guardar un nuevo método de pago
router.post('/setup-intent', PaymentController_1.createSetupIntent);
// Listar los métodos de pago guardados del cliente
router.get('/metodos-pago', PaymentController_1.listPaymentMethods);
// Eliminar un método de pago guardado (por su ID de Stripe)
router.delete('/metodos-pago/:stripePaymentMethodId', PaymentController_1.deletePaymentMethod);
// Establecer un método de pago guardado como principal (por su ID local)
router.post('/metodos-pago/:metodoPagoLocalId/set-principal', PaymentController_1.setPrincipalPaymentMethod);
exports.default = router;
