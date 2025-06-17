import { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2025-05-28.basil' });

export async function processPayment(req: Request, res: Response) {
  try {
    const { pedidoId, monto, paymentMethodId } = req.body;

    // 1. Validar pedido
    const pedido = await prisma.pedido.findUnique({
      where: { id_pedido: pedidoId },
      include: { cliente: true, items: { include: { producto: true } } }
    });
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });
    if (pedido.estado === 'pagado') return res.status(400).json({ message: 'El pedido ya está pagado' });
    if (Number(pedido.total) !== Number(monto)) return res.status(400).json({ message: 'El monto no coincide con el pedido' });

    // 2. Procesar pago con Stripe
    let stripePayment;
    if (paymentMethodId) {
      stripePayment = await stripe.paymentIntents.create({
        amount: Math.round(Number(monto) * 100), // en centavos
        currency: 'ars',
        payment_method: paymentMethodId,
        confirm: true,
        receipt_email: pedido.cliente?.email
      });
      if (stripePayment.status !== 'succeeded') {
        return res.status(400).json({ message: 'Pago rechazado por Stripe' });
      }
    }

    // 3. Actualizar estado del pedido
    await prisma.pedido.update({
      where: { id_pedido: pedidoId },
      data: { estado: 'pagado' }
    });

    // 4. Registrar la venta
    await prisma.venta.create({
      data: {
        pedidoId,
        monto,
        fecha: new Date()
      }
    });

    // 5. Enviar email de confirmación al cliente
    await enviarEmailConfirmacionCliente(pedido.cliente?.email, pedido.cliente?.nombre, pedido);
    // 6. Enviar notificación interna
    await enviarEmailNotificacionInterna(pedido);

    res.json({ message: 'Pago procesado y venta registrada correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error procesando el pago', error: err });
  }
}

async function enviarEmailConfirmacionCliente(email: string, nombre: string, pedido: any) {
  if (!email) return;
  const html = `<h2>¡Gracias por tu compra, ${nombre}!</h2><p>Tu pedido #${pedido.id_pedido} ha sido pagado correctamente.</p>`;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
  await transporter.sendMail({
    from: `Musimundo Travel <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Confirmación de compra',
    html
  });
}

async function enviarEmailNotificacionInterna(pedido: any) {
  // Puedes poner aquí el email de la empresa o leerlo de la base de datos
  const emailEmpresa = process.env.GMAIL_USER;
  const html = `<h2>Nuevo pedido pagado</h2><p>Pedido #${pedido.id_pedido} de ${pedido.cliente?.nombre} (${pedido.cliente?.email})</p>`;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
  await transporter.sendMail({
    from: `Musimundo Travel <${process.env.GMAIL_USER}>`,
    to: emailEmpresa,
    subject: 'Notificación interna: Pedido pagado',
    html
  });
}