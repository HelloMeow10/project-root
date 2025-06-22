"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSetupIntent = createSetupIntent;
exports.listPaymentMethods = listPaymentMethods;
exports.deletePaymentMethod = deletePaymentMethod;
exports.setPrincipalPaymentMethod = setPrincipalPaymentMethod;
exports.processPayment = processPayment;
const prismaClient_1 = require("../prismaClient");
const stripe_1 = __importDefault(require("stripe"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY); // Removí apiVersion por ahora, si da problemas se puede re-añadir una versión válida.
async function createSetupIntent(req, res) {
    try {
        const { userId, tipo } = req.user; // Asumiendo que req.user es poblado por authMiddleware
        if (tipo !== 'cliente') {
            return res.status(403).json({ error: 'Acceso denegado.' });
        }
        // Buscar o crear un cliente de Stripe para este usuario de la aplicación
        let clienteStripeId;
        const clienteApp = await prismaClient_1.prisma.cliente.findUnique({
            where: { id_cliente: userId },
            select: { email: true, nombre: true } // Podríamos añadir un campo stripe_customer_id a Cliente en el futuro
        });
        if (!clienteApp) {
            return res.status(404).json({ message: 'Cliente no encontrado en la aplicación.' });
        }
        // Por ahora, creamos un SetupIntent sin asociarlo a un Customer de Stripe existente.
        // Para asociarlo, necesitaríamos buscar/crear un Customer en Stripe y pasar su ID.
        // const customer = await stripe.customers.create({ email: clienteApp.email, name: clienteApp.nombre });
        // clienteStripeId = customer.id;
        const setupIntent = await stripe.setupIntents.create({
            // customer: clienteStripeId, // Descomentar si se gestionan Customers en Stripe
            payment_method_types: ['card'],
            usage: 'on_session', // O 'off_session' si se va a cobrar más tarde sin interacción
        });
        res.status(200).json({ clientSecret: setupIntent.client_secret });
    }
    catch (error) {
        console.error('Error creando SetupIntent:', error);
        res.status(500).json({ error: 'Error interno del servidor al crear SetupIntent.' });
    }
}
async function listPaymentMethods(req, res) {
    try {
        const { userId, tipo } = req.user;
        if (tipo !== 'cliente') {
            return res.status(403).json({ error: 'Acceso denegado.' });
        }
        const metodos = await prismaClient_1.prisma.metodoPagoCliente.findMany({
            where: { id_cliente: userId },
            orderBy: { es_principal: 'desc' } // Opcional: ordenar por principal primero
        });
        // Opcionalmente, podrías querer obtener detalles de Stripe para cada método,
        // pero por ahora devolvemos lo que tenemos guardado.
        res.status(200).json(metodos);
    }
    catch (error) {
        console.error('Error al listar métodos de pago:', error);
        res.status(500).json({ error: 'Error interno del servidor al listar métodos de pago.' });
    }
}
async function deletePaymentMethod(req, res) {
    try {
        const { userId, tipo } = req.user;
        const { stripePaymentMethodId } = req.params; // Usamos el ID de Stripe para identificarlo
        if (tipo !== 'cliente') {
            return res.status(403).json({ error: 'Acceso denegado.' });
        }
        const metodo = await prismaClient_1.prisma.metodoPagoCliente.findFirst({
            where: {
                id_cliente: userId,
                stripe_payment_method_id: stripePaymentMethodId,
            },
        });
        if (!metodo) {
            return res.status(404).json({ message: 'Método de pago no encontrado o no pertenece al usuario.' });
        }
        // Intentar desvincular de Stripe (esto no elimina el método de pago de Stripe per se,
        // solo lo desvincula del Customer si estuviera vinculado).
        // Si no se gestionan Customers en Stripe, este paso puede ser opcional o diferente.
        try {
            await stripe.paymentMethods.detach(stripePaymentMethodId);
        }
        catch (stripeError) {
            // No bloquear si falla el detach, pero sí loguearlo.
            // Podría fallar si el método ya fue detached o no existe en Stripe.
            console.warn(`Error al intentar desvincular el método de pago ${stripePaymentMethodId} de Stripe:`, stripeError);
        }
        await prismaClient_1.prisma.metodoPagoCliente.delete({
            where: { id_metodo_pago: metodo.id_metodo_pago },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error al eliminar método de pago:', error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar método de pago.' });
    }
}
async function setPrincipalPaymentMethod(req, res) {
    try {
        const { userId, tipo } = req.user;
        const { metodoPagoLocalId } = req.params; // Usamos el ID local de nuestra BD
        if (tipo !== 'cliente') {
            return res.status(403).json({ error: 'Acceso denegado.' });
        }
        const idMetodoLocal = parseInt(metodoPagoLocalId);
        const metodo = await prismaClient_1.prisma.metodoPagoCliente.findFirst({
            where: { id_metodo_pago: idMetodoLocal, id_cliente: userId }
        });
        if (!metodo) {
            return res.status(404).json({ message: "Método de pago no encontrado o no pertenece al usuario." });
        }
        // Transacción para asegurar atomicidad
        await prismaClient_1.prisma.$transaction(async (tx) => {
            // Quitar principal de cualquier otro método del mismo cliente
            await tx.metodoPagoCliente.updateMany({
                where: {
                    id_cliente: userId,
                    es_principal: true,
                },
                data: { es_principal: false },
            });
            // Establecer el nuevo como principal
            await tx.metodoPagoCliente.update({
                where: { id_metodo_pago: idMetodoLocal },
                data: { es_principal: true },
            });
        });
        res.status(200).json({ message: 'Método de pago principal actualizado.' });
    }
    catch (error) {
        console.error('Error al establecer método de pago principal:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
}
async function processPayment(req, res) {
    var _a, _b, _c;
    try {
        const { pedidoId, monto, paymentMethodId, guardarMetodoPago, idDireccionFacturacion } = req.body;
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
        const { userId, tipo } = req.user; // Asumiendo que req.user es poblado por authMiddleware
        if (tipo !== 'cliente' || pedido.id_cliente !== userId) {
            return res.status(403).json({ message: 'No autorizado para pagar este pedido.' });
        }
        // 2. Procesar pago con Stripe
        let paymentIntent;
        let usedStripePaymentMethodId = paymentMethodId; // Puede ser uno nuevo o uno existente de la BD
        if (!usedStripePaymentMethodId) {
            return res.status(400).json({ message: 'Se requiere un método de pago (paymentMethodId).' });
        }
        // Intenta crear y confirmar el PaymentIntent
        try {
            paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(Number(monto) * 100), // en centavos
                currency: 'ars',
                payment_method: usedStripePaymentMethodId,
                confirm: true,
                receipt_email: (_a = pedido.cliente) === null || _a === void 0 ? void 0 : _a.email,
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never',
                },
                // off_session: false, // Asegurarse de que sea on_session si el cliente está presente
                // customer: clienteStripeId, // Si gestionas Customers en Stripe y quieres asociar el pago
            });
        }
        catch (stripeError) {
            console.error("Error de Stripe al crear PaymentIntent:", stripeError);
            return res.status(400).json({ message: `Error de Stripe: ${stripeError.message}` });
        }
        if (paymentIntent.status !== 'succeeded') {
            // Si requiere acción adicional (ej. 3D Secure), el frontend debería manejarlo.
            // Por ahora, si no es 'succeeded' directamente, lo consideramos un fallo aquí.
            return res.status(400).json({ message: 'Pago no completado o requiere acción adicional.', stripeStatus: paymentIntent.status });
        }
        // 3. Actualizar estado del pedido y asociar dirección de facturación
        const dataPedidoUpdate = { estado: 'pagado' };
        if (idDireccionFacturacion) {
            const dirExists = await prismaClient_1.prisma.direccionFacturacion.findFirst({
                where: { id_direccion: idDireccionFacturacion, id_cliente: userId }
            });
            if (dirExists) {
                dataPedidoUpdate.id_direccion_facturacion = idDireccionFacturacion;
            }
            else {
                console.warn(`ID de Dirección de Facturación ${idDireccionFacturacion} no encontrada o no pertenece al cliente ${userId}. No se asociará al pedido.`);
            }
        }
        await prismaClient_1.prisma.pedido.update({
            where: { id_pedido: pedidoId },
            data: dataPedidoUpdate
        });
        // 4. Guardar método de pago si se solicitó y es un nuevo método
        if (guardarMetodoPago && paymentMethodId && paymentIntent.status === 'succeeded') {
            // Verificar si este paymentMethodId ya está guardado para el cliente
            const existingMetodo = await prismaClient_1.prisma.metodoPagoCliente.findFirst({
                where: {
                    id_cliente: userId,
                    stripe_payment_method_id: paymentMethodId,
                },
            });
            if (!existingMetodo) {
                try {
                    const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
                    if (stripePaymentMethod && stripePaymentMethod.card) {
                        // Si es el primer método guardado, marcarlo como principal
                        const countMetodos = await prismaClient_1.prisma.metodoPagoCliente.count({ where: { id_cliente: userId } });
                        const esPrincipalNuevo = countMetodos === 0;
                        if (esPrincipalNuevo) { // Quitar principal de otros si este es el primero (aunque no debería haber otros)
                            await prismaClient_1.prisma.metodoPagoCliente.updateMany({
                                where: { id_cliente: userId, es_principal: true },
                                data: { es_principal: false }
                            });
                        }
                        await prismaClient_1.prisma.metodoPagoCliente.create({
                            data: {
                                id_cliente: userId,
                                stripe_payment_method_id: stripePaymentMethod.id,
                                tipo_tarjeta: stripePaymentMethod.card.brand,
                                ultimos_cuatro_digitos: stripePaymentMethod.card.last4,
                                fecha_expiracion: `${String(stripePaymentMethod.card.exp_month).padStart(2, '0')}/${String(stripePaymentMethod.card.exp_year).slice(-2)}`,
                                es_principal: esPrincipalNuevo,
                            },
                        });
                    }
                }
                catch (retrieveError) {
                    console.error('Error al obtener detalles del método de pago de Stripe para guardarlo:', retrieveError);
                    // No fallar el pago por esto, pero loguear.
                }
            }
        }
        // 5. Registrar la venta
        await prismaClient_1.prisma.venta.create({
            data: {
                pedidoId,
                monto: Number(monto), // Asegurar que sea número
                fecha: new Date(),
                // pedido: { connect: { id_pedido: pedidoId }} // No es necesario si pedidoId es Int
            },
        });
        // 6. Enviar email de confirmación al cliente
        await enviarEmailConfirmacionCliente((_b = pedido.cliente) === null || _b === void 0 ? void 0 : _b.email, (_c = pedido.cliente) === null || _c === void 0 ? void 0 : _c.nombre, pedido);
        // 7. Enviar notificación interna
        await enviarEmailNotificacionInterna(pedido);
        res.json({ message: 'Pago procesado y venta registrada correctamente', pedidoId: pedido.id_pedido, estadoPedido: 'pagado' });
    }
    catch (err) {
        console.error('Error procesando el pago:', err);
        res.status(500).json({ message: 'Error procesando el pago', error: err.message || err });
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
