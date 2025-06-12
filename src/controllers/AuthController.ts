// src/controllers/AuthController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, contrasena } = req.body;
    const { token, tipo } = await authService.login(email, contrasena);
    res.status(200).json({ token, tipo });
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.registerCliente(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}
