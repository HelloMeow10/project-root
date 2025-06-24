import { Router } from 'express';
import { login, register, verifyEmail, forgotPassword, resetPassword, resendVerificationEmail } from '../controllers/AuthController';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/verify-email', verifyEmail); // Cambiado de POST a GET para que funcione con el enlace del email
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-verification', resendVerificationEmail);

export default router;