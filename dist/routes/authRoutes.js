"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const router = (0, express_1.Router)();
router.post('/login', AuthController_1.login);
router.post('/register', AuthController_1.register);
router.get('/verify-email', AuthController_1.verifyEmail); // Cambiado de POST a GET para que funcione con el enlace del email
router.post('/forgot-password', AuthController_1.forgotPassword);
router.post('/reset-password', AuthController_1.resetPassword);
router.post('/resend-verification', AuthController_1.resendVerificationEmail);
exports.default = router;
