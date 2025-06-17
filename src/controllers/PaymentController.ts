import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/db';

// Extend Express Request type (already defined in authMiddleware.ts)
// declare global {
//   namespace Express {
//     interface Request {
//       user?: { userId: number; tipo: 'cliente' | 'admin'; nombre: string };
//     }
//   }
// }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

interface PaymentRequestBody {
  amount: number;
  currency: string;
  id_pedido: number;
}

export async function processPayment(req: Request<{}, {}, PaymentRequestBody>, res: Response) {
  let userId: number | undefined;
  try {
    if (!req.user || req.user.tipo !== 'cliente') {
      return res.status(401).json({ message: 'Acceso no autorizado. Solo clientes pueden procesar pagos.' });
    }
    userId = req.user.userId;

    const { amount, currency, id_pedido } = req.body;

    if (!amount || amount < 1 || !currency || !id_pedido) {
      console.log(`Invalid payment request: amount=${amount}, currency=${currency}, id_pedido=${id_pedido}`);
      return res.status(400).json({ message: 'Invalid amount, currency, or pedido ID' });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id_pedido },
      include: { cliente: true },
    });
    if (!pedido || pedido.id_cliente !== userId) {
      console.log(`Pedido not found or unauthorized: id_pedido=${id_pedido}, userId=${userId}`);
      return res.status(404).json({ message: 'Pedido no encontrado o no autorizado' });
    }

    if (Number(pedido.total) * 100 !== amount) {
      console.log(`Amount mismatch: pedido total=${pedido.total}, provided=${amount / 100}`);
      return res.status(400).json({ message: 'El monto no coincide con el total del pedido' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { id_pedido: id_pedido.toString(), userId: userId.toString() },
    });

    const pago = await prisma.pago.create({
      data: {
        id_pedido,
        monto: amount / 100,
        metodo: 'stripe',
        estado: 'pending',
      },
    });

    console.log(`Created payment intent: ${paymentIntent.id}, pago: ${pago.id_pago}`);
    res.status(200).json({ clientSecret: paymentIntent.client_secret, pagoId: pago.id_pago });
  } catch (error) {
    console.error(`processPayment error for userId ${userId || 'unknown'}:`, error);
    res.status(500).json({ message: 'Error al procesar el pago' });
  }
}