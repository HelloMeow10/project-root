import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

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