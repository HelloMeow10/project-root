"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUsuarioInterno = exports.getAllClientes = exports.getAllUsuariosInternos = void 0;
const UserService_1 = require("../services/UserService");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaClient_1 = require("../prismaClient");
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
const createUsuarioInterno = async (req, res) => {
    try {
        const { nombre, apellido, email, contrasena, telefono, id_rol } = req.body;
        // Valida datos aquí
        const hashed = await bcrypt_1.default.hash(contrasena, 10);
        const nuevo = await prismaClient_1.prisma.usuarioInterno.create({
            data: { nombre, apellido, email, contrasena: hashed, telefono, id_rol }
        });
        res.status(201).json(nuevo);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al crear usuario interno' });
    }
};
exports.createUsuarioInterno = createUsuarioInterno;
