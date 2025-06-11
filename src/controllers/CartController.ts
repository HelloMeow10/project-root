import { Request, Response } from 'express';
import { prisma } from '../config/db';

interface CartRequestBody {
  productId: number;
  quantity: number;
}

export async function addToCart(req: Request<{}, {}, CartRequestBody>, res: Response) {
  const { productId, quantity } = req.body;
  const userId = (req as any).user.id;

  try {
    const cartItem = await prisma.cart.create({
      data: {
        userId,
        productId,
        quantity,
      },
    });
    res.status(201).json(cartItem);
  } catch (err) {
    res.status(500).json({ message: 'Error al agregar al carrito' });
  }
}