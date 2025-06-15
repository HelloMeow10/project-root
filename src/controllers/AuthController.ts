// src/controllers/AuthController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { enviarBienvenida } from '../mailer';

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
    // Envía el correo de bienvenida
    await enviarBienvenida(user.email, user.nombre);
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(400).json({ message: 'El correo ya está registrado.' });
    }
    next(err);
  }
}
