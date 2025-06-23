"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminOnly_1 = require("../middlewares/adminOnly");
const router = (0, express_1.Router)();
// Rutas para Usuarios Internos (protegidas y solo para admins)
router.get('/internos', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.getAllUsuariosInternos);
router.get('/clientes', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.getAllClientes);
router.post('/internos', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.createUsuarioInterno);
router.patch('/internos/:id/activo', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.toggleActivoUsuarioInterno);
router.delete('/internos/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.eliminarUsuarioInterno);
router.get('/internos/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.obtenerUsuarioInternoPorId);
router.put('/internos/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.editarUsuarioInterno);
// Rutas para el Cliente autenticado
router.get('/me', authMiddleware_1.authMiddleware, UserController_1.getAuthenticatedUserData);
router.put('/me', authMiddleware_1.authMiddleware, UserController_1.updateAuthenticatedClienteData); // Nueva ruta para actualizar datos del cliente
exports.default = router;
