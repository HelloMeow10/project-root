import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import bcrypt from 'bcrypt';
import { prisma } from '../prismaClient';
import { enviarBienvenida } from '../mailer';

const userService = new UserService();

export const getAllUsuariosInternos = async (req: Request, res: Response) => {
  try {
    const data = await userService.obtenerUsuariosInternos();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios internos' });
  }
};

export const getAllClientes = async (req: Request, res: Response) => {
  try {
    const data = await userService.obtenerClientes();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

export const createUsuarioInterno = async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, email, contrasena, telefono, id_rol } = req.body;
    // Valida datos aquí
    const hashed = await bcrypt.hash(contrasena, 10);
    const nuevo = await prisma.usuarioInterno.create({
      data: { nombre, apellido, email, contrasena: hashed, telefono, id_rol }
    });
    await enviarBienvenida(nuevo.email, nuevo.nombre);
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario interno' });
  }
};

export const toggleActivoUsuarioInterno = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { activo } = req.body;
  try {
    await prisma.usuarioInterno.update({
      where: { id_usuario: Number(id) }, // <--- aquí el cambio
      data: { activo }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
};

export const eliminarUsuarioInterno = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.usuarioInterno.delete({
      where: { id_usuario: Number(id) } // <--- aquí el cambio
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

export const obtenerUsuarioInternoPorId = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const usuario = await prisma.usuarioInterno.findUnique({
      where: { id_usuario: Number(id) }
    });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

export const editarUsuarioInterno = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, apellido, email, telefono, id_rol } = req.body;
  try {
    await prisma.usuarioInterno.update({
      where: { id_usuario: Number(id) },
      data: { nombre, apellido, email, telefono, id_rol }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

export const obtenerUsuarios = async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuarioInterno.findMany({
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
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};