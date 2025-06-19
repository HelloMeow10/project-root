"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminOnly_1 = require("../middlewares/adminOnly");
const router = (0, express_1.Router)();
// Rutas para Usuarios Internos
router.get('/internos', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.getAllUsuariosInternos);
router.post('/internos', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.createUsuarioInterno);
router.get('/internos/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.obtenerUsuarioInternoPorId);
router.put('/internos/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.editarUsuarioInterno);
router.patch('/internos/:id/activo', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.toggleActivoUsuarioInterno);
router.delete('/internos/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.eliminarUsuarioInterno);
// Rutas para Clientes
router.get('/clientes', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.getAllClientes);
router.put('/clientes/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.editarCliente);
router.patch('/clientes/:id/activo', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.toggleActivoCliente);
router.delete('/clientes/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, UserController_1.eliminarCliente);
exports.default = router;
