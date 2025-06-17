import { Router } from 'express';
import { login, register, verifyEmail, forgotPassword, resetPassword, resendVerificationEmail } from '../controllers/AuthController';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-verification', resendVerificationEmail);

export default router;