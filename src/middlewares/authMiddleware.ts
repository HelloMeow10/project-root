import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        tipo: 'cliente' | 'admin';
        nombre: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  console.log('Auth Middleware - Authorization Header:', authHeader ? 'Present' : 'Missing'); // Debug

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token provided or invalid format');
    res.status(401).json({ message: 'Token no proporcionado o formato inválido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  console.log('Auth Middleware - Token:', token ? 'Present' : 'Missing'); // Debug

  if (!token) {
    console.log('Token missing after split');
    res.status(401).json({ message: 'Token no proporcionado' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      tipo: 'cliente' | 'admin';
      nombre: string;
    };
    console.log('Auth Middleware - Decoded JWT Payload:', decoded); // Debug
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Middleware - Invalid token:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
}