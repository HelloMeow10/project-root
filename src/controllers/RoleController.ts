import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prismaClient'; // Ajusta tu ruta a Prisma Client

export const getAllRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roles = await prisma.rol.findMany({
            select: {
                id_rol: true,
                nombre: true,
                descripcion: true, // Incluyo descripción
            }
        });
        res.status(200).json(roles);
    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener roles.' });
    }
};

export const createRol = async (req: Request, res: Response, next: NextFunction) => {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
        return res.status(400).json({ message: 'El nombre del rol es requerido.' });
    }
    try {
        const existingRol = await prisma.rol.findUnique({ where: { nombre } });
        if (existingRol) {
            return res.status(409).json({ message: 'Ya existe un rol con ese nombre.' });
        }
        const newRol = await prisma.rol.create({
            data: { nombre, descripcion },
            select: { id_rol: true, nombre: true, descripcion: true }
        });
        res.status(201).json(newRol);
    } catch (error) {
        console.error('Error al crear rol:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el rol.' });
    }
};

export const updateRol = async (req: Request, res: Response, next: NextFunction) => {
    const { id_rol } = req.params;
    const { nombre, descripcion } = req.body;
    if (!nombre) {
        return res.status(400).json({ message: 'El nombre del rol es requerido.' });
    }
    try {
        const rolId = parseInt(id_rol, 10);
        const existingRolWithNewName = await prisma.rol.findFirst({
            where: { nombre, NOT: { id_rol: rolId } },
        });
        if (existingRolWithNewName) {
            return res.status(409).json({ message: 'Ya existe otro rol con ese nuevo nombre.' });
        }
        const updatedRol = await prisma.rol.update({
            where: { id_rol: rolId },
            data: { nombre, descripcion },
            select: { id_rol: true, nombre: true, descripcion: true }
        });
        res.status(200).json(updatedRol);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Rol no encontrado.' });
        }
        console.error('Error al actualizar rol:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el rol.' });
    }
};

export const deleteRol = async (req: Request, res: Response, next: NextFunction) => {
    const { id_rol } = req.params;
    try {
        const rolId = parseInt(id_rol, 10);
        const usuariosConEsteRol = await prisma.usuarioInterno.count({
            where: { id_rol: rolId },
        });
        if (usuariosConEsteRol > 0) {
            return res.status(400).json({ 
                message: `Este rol está asignado a ${usuariosConEsteRol} usuario(s) y no puede ser eliminado.` 
            });
        }
        await prisma.rol.delete({ where: { id_rol: rolId } });
        res.status(200).json({ message: 'Rol eliminado correctamente.' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Rol no encontrado.' });
        }
        console.error('Error al eliminar rol:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el rol.' });
    }
};