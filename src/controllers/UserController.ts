import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import bcrypt from 'bcrypt';
import { prisma } from '../prismaClient';

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
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario interno' });
  }
};