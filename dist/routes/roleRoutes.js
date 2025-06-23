"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RoleController_1 = require("../controllers/RoleController");
// import authMiddleware from '../middlewares/authMiddleware'; // Descomentar y usar si es necesario
// import adminOnly from '../middlewares/adminOnly';       // Descomentar y usar si es necesario
const router = (0, express_1.Router)();
// Aplica middlewares como authMiddleware y adminOnly aquí según tus necesidades de seguridad
router.get('/', RoleController_1.getAllRoles);
router.post('/', RoleController_1.createRol); // Podrías proteger con adminOnly
router.put('/:id_rol', RoleController_1.updateRol); // Podrías proteger con adminOnly
router.delete('/:id_rol', RoleController_1.deleteRol); // Podrías proteger con adminOnly
exports.default = router;
