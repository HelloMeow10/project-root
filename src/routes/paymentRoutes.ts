import { Router } from 'express';
import { 
    processPayment,
    createSetupIntent,
    listPaymentMethods,
    deletePaymentMethod,
    setPrincipalPaymentMethod
} from '../controllers/PaymentController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas aquí requieren autenticación de cliente
router.use(authMiddleware);

// Procesar un pago para un pedido
router.post('/', processPayment);

// Crear un SetupIntent para guardar un nuevo método de pago
router.post('/setup-intent', createSetupIntent);

// Listar los métodos de pago guardados del cliente
router.get('/metodos-pago', listPaymentMethods);

// Eliminar un método de pago guardado (por su ID de Stripe)
router.delete('/metodos-pago/:stripePaymentMethodId', deletePaymentMethod);

// Establecer un método de pago guardado como principal (por su ID local)
router.post('/metodos-pago/:metodoPagoLocalId/set-principal', setPrincipalPaymentMethod);

export default router;