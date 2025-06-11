import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

const userService = new UserService();

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const usuarios = await userService.obtenerUsuarios();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};