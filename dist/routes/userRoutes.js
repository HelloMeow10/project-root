"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminOnly_1 = require("../middlewares/adminOnly");
const router = (0, express_1.Router)();
router.get('/internos', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.getAllUsuariosInternos);
router.get('/clientes', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.getAllClientes);
router.post('/internos', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.createUsuarioInterno);
// PATCH para activar/desactivar usuario interno
router.patch('/internos/:id/activo', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.toggleActivoUsuarioInterno);
// DELETE para eliminar usuario interno
router.delete('/internos/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.eliminarUsuarioInterno);
// Obtener usuario interno por ID
router.get('/internos/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.obtenerUsuarioInternoPorId);
// Editar usuario interno
router.put('/internos/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.editarUsuarioInterno);
router.get('/me', authMiddleware_1.authMiddleware, UserController_1.getAuthenticatedUserData);
exports.default = router;
