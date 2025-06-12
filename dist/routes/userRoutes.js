"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const router = (0, express_1.Router)();
router.get('/internos', UserController_1.getAllUsuariosInternos);
router.get('/clientes', UserController_1.getAllClientes);
exports.default = router;
