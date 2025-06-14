// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: 'Token no proporcionado' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded as any;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
}

// Assuming you have an Express router instance
import { Router } from 'express';
const router = Router();

// Your clearCart controller logic here
function clearCart(req: Request, res: Response) {
  // Clear cart logic
  res.json({ message: 'Cart cleared' });
}

// Apply the authMiddleware to the delete route
router.delete('/', authMiddleware, clearCart);

export default router;
