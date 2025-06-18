"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPayment = processPayment;
const prismaClient_1 = require("../prismaClient");
const stripe_1 = __importDefault(require("stripe"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-05-28.basil' });
async function processPayment(req, res) {
    var _a, _b, _c;
    try {
        const { pedidoId, monto, paymentMethodId } = req.body;
        // 1. Validar pedido
        const pedido = await prismaClient_1.prisma.pedido.findUnique({
            where: { id_pedido: pedidoId },
            include: { cliente: true, items: { include: { producto: true } } }
        });
        if (!pedido)
            return res.status(404).json({ message: 'Pedido no encontrado' });
        if (pedido.estado === 'pagado')
            return res.status(400).json({ message: 'El pedido ya está pagado' });
        if (Number(pedido.total) !== Number(monto))
            return res.status(400).json({ message: 'El monto no coincide con el pedido' });
        // 2. Procesar pago con Stripe
        let stripePayment;
        if (paymentMethodId) {
            stripePayment = await stripe.paymentIntents.create({
                amount: Math.round(Number(monto) * 100), // en centavos
                currency: 'ars',
                payment_method: paymentMethodId,
                confirm: true,
                receipt_email: (_a = pedido.cliente) === null || _a === void 0 ? void 0 : _a.email
            });
            if (stripePayment.status !== 'succeeded') {
                return res.status(400).json({ message: 'Pago rechazado por Stripe' });
            }
        }
        // 3. Actualizar estado del pedido
        await prismaClient_1.prisma.pedido.update({
            where: { id_pedido: pedidoId },
            data: { estado: 'pagado' }
        });
        // 4. Registrar la venta
        await prismaClient_1.prisma.venta.create({
            data: {
                pedidoId,
                monto,
                fecha: new Date()
            }
        });
        // 5. Enviar email de confirmación al cliente
        await enviarEmailConfirmacionCliente((_b = pedido.cliente) === null || _b === void 0 ? void 0 : _b.email, (_c = pedido.cliente) === null || _c === void 0 ? void 0 : _c.nombre, pedido);
        // 6. Enviar notificación interna
        await enviarEmailNotificacionInterna(pedido);
        res.json({ message: 'Pago procesado y venta registrada correctamente' });
    }
    catch (err) {
        res.status(500).json({ message: 'Error procesando el pago', error: err });
    }
}
async function enviarEmailConfirmacionCliente(email, nombre, pedido) {
    if (!email)
        return;
    const html = `<h2>¡Gracias por tu compra, ${nombre}!</h2><p>Tu pedido #${pedido.id_pedido} ha sido pagado correctamente.</p>`;
    const transporter = nodemailer_1.default.createTransport({
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
async function enviarEmailNotificacionInterna(pedido) {
    var _a, _b;
    // Puedes poner aquí el email de la empresa o leerlo de la base de datos
    const emailEmpresa = process.env.GMAIL_USER;
    const html = `<h2>Nuevo pedido pagado</h2><p>Pedido #${pedido.id_pedido} de ${(_a = pedido.cliente) === null || _a === void 0 ? void 0 : _a.nombre} (${(_b = pedido.cliente) === null || _b === void 0 ? void 0 : _b.email})</p>`;
    const transporter = nodemailer_1.default.createTransport({
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
