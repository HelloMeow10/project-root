"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarCliente = exports.toggleActivoCliente = exports.editarCliente = exports.obtenerUsuarios = exports.editarUsuarioInterno = exports.obtenerUsuarioInternoPorId = exports.eliminarUsuarioInterno = exports.toggleActivoUsuarioInterno = exports.createUsuarioInterno = exports.getAllClientes = exports.getAllUsuariosInternos = void 0;
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
// --- Funciones CRUD para Clientes ---
const editarCliente = async (req, res) => {
    var _a, _b;
    const { id } = req.params;
    const { nombre, apellido, email, telefono, direccion } = req.body;
    const idCliente = Number(id);
    if (isNaN(idCliente)) {
        return res.status(400).json({ message: 'ID de cliente inválido.' });
    }
    try {
        const clienteExistente = await prismaClient_1.prisma.cliente.findUnique({
            where: { id_cliente: idCliente },
        });
        if (!clienteExistente) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }
        const updatedCliente = await prismaClient_1.prisma.cliente.update({
            where: { id_cliente: idCliente },
            data: {
                nombre,
                apellido,
                email,
                telefono,
                direccion,
                // Nota: No se actualiza la contraseña aquí
            },
        });
        res.json({ message: 'Cliente actualizado con éxito.', cliente: updatedCliente });
    }
    catch (error) {
        console.error('Error al editar cliente:', error);
        if (error.code === 'P2025') { // "Record to update not found" - aunque ya validamos arriba, es una salvaguarda
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }
        // Manejo de otros posibles errores, como violación de constraint unique para email
        if (error.code === 'P2002' && ((_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('email'))) {
            return res.status(409).json({ message: 'El email proporcionado ya está en uso por otro cliente.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar el cliente.' });
    }
};
exports.editarCliente = editarCliente;
const toggleActivoCliente = async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;
    const idCliente = Number(id);
    if (isNaN(idCliente)) {
        return res.status(400).json({ message: 'ID de cliente inválido.' });
    }
    if (typeof activo !== 'boolean') {
        return res.status(400).json({ message: 'El valor de "activo" debe ser un booleano.' });
    }
    try {
        const clienteExistente = await prismaClient_1.prisma.cliente.findUnique({
            where: { id_cliente: idCliente },
        });
        if (!clienteExistente) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }
        const updatedCliente = await prismaClient_1.prisma.cliente.update({
            where: { id_cliente: idCliente },
            data: { activo },
        });
        res.json({
            message: `Cliente ${activo ? 'activado' : 'desactivado'} con éxito.`,
            cliente: updatedCliente
        });
    }
    catch (error) {
        console.error('Error al cambiar estado activo del cliente:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al cambiar el estado del cliente.' });
    }
};
exports.toggleActivoCliente = toggleActivoCliente;
const eliminarCliente = async (req, res) => {
    var _a;
    const { id } = req.params;
    const idCliente = Number(id);
    if (isNaN(idCliente)) {
        return res.status(400).json({ message: 'ID de cliente inválido.' });
    }
    try {
        // Primero verificamos si el cliente existe, ya que Prisma delete no falla si no existe si no se usa findUniqueOrThrow
        const clienteExistente = await prismaClient_1.prisma.cliente.findUnique({
            where: { id_cliente: idCliente },
        });
        if (!clienteExistente) {
            return res.status(404).json({ message: 'Cliente no encontrado para eliminar.' });
        }
        await prismaClient_1.prisma.cliente.delete({
            where: { id_cliente: idCliente },
        });
        res.json({ message: 'Cliente eliminado con éxito.' });
    }
    catch (error) {
        console.error('Error al eliminar cliente:', error);
        // El código P2025 significa "Record to delete does not exist."
        // Aunque ya lo verificamos arriba, es una buena práctica tenerlo por si la lógica cambia.
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Cliente no encontrado para eliminar.' });
        }
        // Otros errores pueden ser por restricciones de clave foránea, etc.
        // Por ejemplo, P2003: Foreign key constraint failed on the field: `field_name`
        if (error.code === 'P2003') {
            return res.status(409).json({ message: 'No se puede eliminar el cliente porque tiene registros asociados (ej. pedidos).', details: (_a = error.meta) === null || _a === void 0 ? void 0 : _a.field_name });
        }
        res.status(500).json({ message: 'Error interno del servidor al eliminar el cliente.' });
    }
};
exports.eliminarCliente = eliminarCliente;
