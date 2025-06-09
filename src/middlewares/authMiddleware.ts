// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token no proporcionado' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    // Adjuntar datos del usuario al request (opcional)
    (req as any).userId = payload.userId;
    (req as any).userRole = payload.rol;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}
