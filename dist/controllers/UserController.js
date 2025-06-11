"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllClientes = exports.getAllUsuariosInternos = void 0;
const UserService_1 = require("../services/UserService");
const userService = new UserService_1.UserService();
const getAllUsuariosInternos = async (req, res) => {
    try {
        const data = await userService.obtenerUsuariosInternos();
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener usuarios internos' });
    }
};
exports.getAllUsuariosInternos = getAllUsuariosInternos;
const getAllClientes = async (req, res) => {
    try {
        const data = await userService.obtenerClientes();
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
};
exports.getAllClientes = getAllClientes;
