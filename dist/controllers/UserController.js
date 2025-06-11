"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = void 0;
const UserService_1 = require("../services/UserService");
const userService = new UserService_1.UserService();
const getAllUsers = async (req, res) => {
    try {
        const usuarios = await userService.obtenerUsuarios();
        res.json(usuarios);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};
exports.getAllUsers = getAllUsers;
