"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerUsuarios = exports.editarUsuarioInterno = exports.obtenerUsuarioInternoPorId = exports.eliminarUsuarioInterno = exports.toggleActivoUsuarioInterno = exports.createUsuarioInterno = exports.getAllClientes = exports.getAllUsuariosInternos = void 0;
exports.getAuthenticatedUserData = getAuthenticatedUserData;
const UserService_1 = require("../services/UserService");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaClient_1 = require("../prismaClient");
const mailer_1 = require("../mailer");
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
        await (0, mailer_1.enviarBienvenida)(nuevo.email, nuevo.nombre);
        res.status(201).json(nuevo);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al crear usuario interno' });
    }
};
exports.createUsuarioInterno = createUsuarioInterno;
const toggleActivoUsuarioInterno = async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;
    try {
        await prismaClient_1.prisma.usuarioInterno.update({
            where: { id_usuario: Number(id) }, // <--- aquí el cambio
            data: { activo }
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ message: 'Error al actualizar estado' });
    }
};
exports.toggleActivoUsuarioInterno = toggleActivoUsuarioInterno;
const eliminarUsuarioInterno = async (req, res) => {
    const { id } = req.params;
    try {
        await prismaClient_1.prisma.usuarioInterno.delete({
            where: { id_usuario: Number(id) } // <--- aquí el cambio
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};
exports.eliminarUsuarioInterno = eliminarUsuarioInterno;
const obtenerUsuarioInternoPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const usuario = await prismaClient_1.prisma.usuarioInterno.findUnique({
            where: { id_usuario: Number(id) }
        });
        res.json(usuario);
    }
    catch (err) {
        res.status(500).json({ message: 'Error al obtener usuario' });
    }
};
exports.obtenerUsuarioInternoPorId = obtenerUsuarioInternoPorId;
const editarUsuarioInterno = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, id_rol } = req.body;
    try {
        await prismaClient_1.prisma.usuarioInterno.update({
            where: { id_usuario: Number(id) },
            data: { nombre, apellido, email, telefono, id_rol }
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};
exports.editarUsuarioInterno = editarUsuarioInterno;
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await prismaClient_1.prisma.usuarioInterno.findMany({
            select: {
                id_usuario: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
                activo: true,
                id_rol: true
            }
        });
        res.json(usuarios);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
};
exports.obtenerUsuarios = obtenerUsuarios;
async function getAuthenticatedUserData(req, res) {
    try {
        const { userId, tipo } = req.user;
        if (tipo !== 'cliente') {
            return res.status(403).json({ error: 'Acceso denegado. Solo los clientes pueden acceder a esta información.' });
        }
        const cliente = await prismaClient_1.prisma.cliente.findUnique({
            where: { id_cliente: userId },
            select: {
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
                direccion: true,
            },
        });
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }
        return res.status(200).json(cliente);
    }
    catch (error) {
        console.error('Error al obtener datos del usuario autenticado:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}
