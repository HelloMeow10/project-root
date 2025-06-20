"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRol = exports.updateRol = exports.createRol = exports.getAllRoles = void 0;
const prismaClient_1 = require("../prismaClient"); // Ajusta tu ruta a Prisma Client
const getAllRoles = async (req, res, next) => {
    try {
        const roles = await prismaClient_1.prisma.rol.findMany({
            select: {
                id_rol: true,
                nombre: true,
                descripcion: true, // Incluyo descripción
            }
        });
        res.status(200).json(roles);
    }
    catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener roles.' });
    }
};
exports.getAllRoles = getAllRoles;
const createRol = async (req, res, next) => {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
        return res.status(400).json({ message: 'El nombre del rol es requerido.' });
    }
    try {
        const existingRol = await prismaClient_1.prisma.rol.findUnique({ where: { nombre } });
        if (existingRol) {
            return res.status(409).json({ message: 'Ya existe un rol con ese nombre.' });
        }
        const newRol = await prismaClient_1.prisma.rol.create({
            data: { nombre, descripcion },
            select: { id_rol: true, nombre: true, descripcion: true }
        });
        res.status(201).json(newRol);
    }
    catch (error) {
        console.error('Error al crear rol:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el rol.' });
    }
};
exports.createRol = createRol;
const updateRol = async (req, res, next) => {
    const { id_rol } = req.params;
    const { nombre, descripcion } = req.body;
    if (!nombre) {
        return res.status(400).json({ message: 'El nombre del rol es requerido.' });
    }
    try {
        const rolId = parseInt(id_rol, 10);
        const existingRolWithNewName = await prismaClient_1.prisma.rol.findFirst({
            where: { nombre, NOT: { id_rol: rolId } },
        });
        if (existingRolWithNewName) {
            return res.status(409).json({ message: 'Ya existe otro rol con ese nuevo nombre.' });
        }
        const updatedRol = await prismaClient_1.prisma.rol.update({
            where: { id_rol: rolId },
            data: { nombre, descripcion },
            select: { id_rol: true, nombre: true, descripcion: true }
        });
        res.status(200).json(updatedRol);
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Rol no encontrado.' });
        }
        console.error('Error al actualizar rol:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el rol.' });
    }
};
exports.updateRol = updateRol;
const deleteRol = async (req, res, next) => {
    const { id_rol } = req.params;
    try {
        const rolId = parseInt(id_rol, 10);
        const usuariosConEsteRol = await prismaClient_1.prisma.usuarioInterno.count({
            where: { id_rol: rolId },
        });
        if (usuariosConEsteRol > 0) {
            return res.status(400).json({
                message: `Este rol está asignado a ${usuariosConEsteRol} usuario(s) y no puede ser eliminado.`
            });
        }
        await prismaClient_1.prisma.rol.delete({ where: { id_rol: rolId } });
        res.status(200).json({ message: 'Rol eliminado correctamente.' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Rol no encontrado.' });
        }
        console.error('Error al eliminar rol:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el rol.' });
    }
};
exports.deleteRol = deleteRol;
