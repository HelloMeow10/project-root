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
    const cartItem = await prisma.carrito.create({
      data: {
        id_cliente: userId,
        // Asegúrate de que los campos coincidan con tu modelo CarritoItem
        items: {
          create: [{
            id_producto: productId,
            cantidad: quantity,
          }]
        }
      },
      include: { items: true }
    });
    res.status(201).json(cartItem);
  } catch (err) {
    res.status(500).json({ message: 'Error al agregar al carrito' });
  }
}