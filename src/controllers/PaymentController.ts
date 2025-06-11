import { Request, Response } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2025-05-28.basil' });

interface PaymentRequestBody {
  amount: number;
  currency: string;
}

export async function processPayment(req: Request<{}, {}, PaymentRequestBody>, res: Response) {
  const { amount, currency } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: 'Error al procesar el pago' });
  }
}