import { Request, Response } from 'express';
import { prisma } from '../config/db';

export async function getTransactions(req: Request, res: Response) {
  try {
    const transactions = await prisma.pedido.findMany({
      include: {
        cliente: true,
        items: { include: { producto: true } },
        pagos: true
      }
    });
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener transacciones' });
  }
}