import { Request, Response, NextFunction } from 'express';

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.tipo !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: solo administradores.' });
  }
  next();
}