import { Request, Response } from 'express';
import { prisma } from '../prismaClient';

export async function getCart(req: Request, res: Response) {
  const userId = (req as any).user.userId;
  const carrito = await prisma.carrito.findFirst({
    where: { id_cliente: userId },
    include: {
      items: {
        include: { producto: true }
      }
    }
  });
  res.json(carrito?.items || []);
}

export async function addToCart(req: Request, res: Response) {
  const userId = (req as any).user.userId;
  const { productId, cantidad } = req.body;

  // Busca o crea el carrito del usuario
  let carrito = await prisma.carrito.findFirst({ where: { id_cliente: userId } });
  if (!carrito) {
    carrito = await prisma.carrito.create({ data: { id_cliente: userId } });
  }

  // Agrega el producto al carrito
  const item = await prisma.carritoItem.create({
    data: {
      id_carrito: carrito.id_carrito,
      id_producto: productId,
      cantidad: cantidad || 1
    }
  });

  res.status(201).json(item);
}

export async function clearCart(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const carrito = await prisma.carrito.findFirst({ where: { id_cliente: userId } });
    if (!carrito) return res.status(200).json({ message: 'Carrito ya vacío' });

    await prisma.carritoItem.deleteMany({ where: { id_carrito: carrito.id_carrito } });

    res.json({ message: 'Carrito vaciado exitosamente' });
  } catch (err) {
    console.error('Error al vaciar carrito:', err);
    res.status(500).json({ message: 'Error al vaciar carrito', error: err });
  }
}