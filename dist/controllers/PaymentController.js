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
// import Stripe from 'stripe'; // Stripe no se usará directamente aquí ahora
const nodemailer_1 = __importDefault(require("nodemailer"));
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string); // Stripe SDK ya no es necesario para estas operaciones directas
async function createSetupIntent(req, res) {
    // Esta funcionalidad estaba ligada a Stripe. Con la eliminación de Stripe,
    // un "SetupIntent" en el sentido de Stripe ya no es aplicable.
    // Si se implementa una forma personalizada y segura de guardar tarjetas,
    // se necesitaría un endpoint diferente o una lógica completamente nueva aquí.
    console.warn("API endpoint /setup-intent llamado, pero la funcionalidad de Stripe SetupIntent está deshabilitada.");
    return res.status(501).json({
        message: 'Funcionalidad no implementada. La creación de SetupIntent de Stripe ha sido deshabilitada.'
    });
}
async function listPaymentMethods(req, res) {
    // Esta función lista los métodos de pago guardados en la base de datos local.
    // La información de 'stripe_payment_method_id' ya no será relevante si se elimina de la BD.
    // El frontend ya deshabilita la visualización/uso de estos métodos por ahora.
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
        // El campo `stripe_payment_method_id` en los objetos `metodos` será ignorado o nulo.
        res.status(200).json(metodos);
    }
    catch (error) {
        console.error('Error al listar métodos de pago (locales):', error);
        res.status(500).json({ error: 'Error interno del servidor al listar métodos de pago (locales).' });
    }
}
async function deletePaymentMethod(req, res) {
    try {
        const { userId, tipo } = req.user;
        const { stripePaymentMethodId: localPaymentMethodId } = req.params; // Renombrar para claridad, ya no es ID de Stripe
        if (tipo !== 'cliente') {
            return res.status(403).json({ error: 'Acceso denegado.' });
        }
        // El ID que se pasa ahora debería ser el ID local del método de pago (id_metodo_pago)
        // ya que no estamos usando IDs de Stripe para identificar los métodos a eliminar.
        // El frontend fue modificado para no ofrecer esta opción por ahora, pero si se reactiva,
        // deberá pasar el id_metodo_pago local.
        // Por ahora, asumimos que localPaymentMethodId es el id_metodo_pago de nuestra BD.
        // Sin embargo, la ruta original usa stripePaymentMethodId.
        // Para evitar romper la ruta si el frontend aún la llama con un valor,
        // buscaremos por stripe_payment_method_id si el ID parece de Stripe, o por id_metodo_pago si es numérico.
        // Idealmente, la ruta y el parámetro deberían cambiar a /metodos-pago/:localId
        let metodo;
        const potentialLocalId = parseInt(localPaymentMethodId);
        if (!isNaN(potentialLocalId)) {
            metodo = await prismaClient_1.prisma.metodoPagoCliente.findFirst({
                where: { id_metodo_pago: potentialLocalId, id_cliente: userId },
            });
        }
        else {
            // Si no es un número, podría ser un antiguo ID de Stripe, aunque esto ya no debería ocurrir.
            // Esta rama es para compatibilidad o si la limpieza no fue total.
            metodo = await prismaClient_1.prisma.metodoPagoCliente.findFirst({
                where: { id_cliente: userId, stripe_payment_method_id: localPaymentMethodId },
            });
        }
        if (!metodo) {
            return res.status(404).json({ message: 'Método de pago no encontrado o no pertenece al usuario.' });
        }
        // Ya no se intenta desvincular de Stripe porque Stripe no está integrado aquí.
        // await stripe.paymentMethods.detach(stripePaymentMethodId); // ELIMINADO
        await prismaClient_1.prisma.metodoPagoCliente.delete({
            where: { id_metodo_pago: metodo.id_metodo_pago }, // Usar el ID local del método encontrado
        });
        console.log(`Método de pago local con ID ${metodo.id_metodo_pago} eliminado para el usuario ${userId}.`);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error al eliminar método de pago (local):', error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar método de pago (local).' });
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
    var _a, _b;
    try {
        const { pedidoId, monto, cardDetails, guardarMetodoPago, idDireccionFacturacion } = req.body;
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
        const { userId, tipo } = req.user;
        if (tipo !== 'cliente' || pedido.id_cliente !== userId) {
            return res.status(403).json({ message: 'No autorizado para pagar este pedido.' });
        }
        // 2. Procesar pago (Simulación - Stripe está siendo eliminado)
        // ** ADVERTENCIA DE SEGURIDAD IMPORTANTE **
        // El siguiente bloque SIMULA un procesamiento de pago.
        // En un entorno real, NUNCA debes manejar detalles de tarjeta crudos (PAN, CVV, fecha de expiración)
        // en tu backend de esta manera a menos que tu infraestructura sea TOTALMENTE compatible con PCI DSS.
        // Integrar un procesador de pagos certificado (como Stripe, PayPal, etc.) que tokenice
        // la información de la tarjeta en el frontend es la práctica estándar y segura.
        // Este código es solo para fines demostrativos de la lógica de la aplicación SIN Stripe.
        let paymentSuccessful = false;
        if (cardDetails && cardDetails.cardNumber && cardDetails.cardName && cardDetails.expiryDate && cardDetails.cvv) {
            // Aquí iría la lógica de integración con un procesador de pagos real.
            // Para esta simulación, asumiremos que si los detalles básicos están presentes, el pago es "exitoso".
            console.log("SIMULACIÓN: Procesando pago con los siguientes detalles de tarjeta (NO HACER ESTO EN PRODUCCIÓN):");
            console.log(`SIMULACIÓN: Número Tarjeta (últimos 4): **** **** **** ${cardDetails.cardNumber.slice(-4)}`);
            console.log(`SIMULACIÓN: Nombre Tarjeta: ${cardDetails.cardName}`);
            console.log(`SIMULACIÓN: Expiración: ${cardDetails.expiryDate}`);
            // NO LOGUEAR CVV NI EN SIMULACIÓN REAL SI ESTOS DATOS FUERAN REALES
            // Simular éxito
            paymentSuccessful = true;
            console.log("SIMULACIÓN: Pago considerado exitoso.");
        }
        else {
            // Lógica para manejar métodos de pago guardados (si se reimplementa sin Stripe)
            // Por ahora, si no hay cardDetails, es un error porque los métodos guardados están deshabilitados.
            return res.status(400).json({ message: 'Se requieren detalles completos de la tarjeta para procesar el pago.' });
        }
        if (!paymentSuccessful) {
            return res.status(400).json({ message: 'Pago no completado. Error en la simulación o datos incompletos.' });
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
        // 4. Guardar "método de pago" si se solicitó (adaptado, sin Stripe)
        // ** ADVERTENCIA DE SEGURIDAD **: Guardar detalles de tarjeta crudos es EXTREMADAMENTE RIESGOSO y NO PCI COMPLIANT.
        // Esto es una SIMULACIÓN de la lógica. En un sistema real, se guardaría un token o referencia segura.
        // Por ahora, la funcionalidad de guardar método de pago se simplificará drásticamente
        // y NO almacenará los detalles completos de la tarjeta.
        if (guardarMetodoPago && cardDetails && paymentSuccessful) {
            console.log("SIMULACIÓN: Intento de guardar método de pago (lógica adaptada sin Stripe).");
            // Aquí no se guardará el stripe_payment_method_id.
            // Se podría guardar una representación de la tarjeta (ej. últimos 4 dígitos, marca, expiración)
            // pero NUNCA el número completo o CVV.
            // Esta parte necesita una refactorización mayor si se quiere una funcionalidad de guardado segura sin Stripe.
            // Por ahora, solo loguearemos la intención.
            // Ejemplo de lo que se podría guardar (de forma insegura si fueran datos reales, pero es simulación):
            const tipoTarjetaSimulada = "visa"; // Simular detección de tipo
            const ultimosCuatroSimulados = cardDetails.cardNumber.slice(-4);
            // Verificar si ya existe una "representación" similar para evitar duplicados simples
            const existingMetodo = await prismaClient_1.prisma.metodoPagoCliente.findFirst({
                where: {
                    id_cliente: userId,
                    ultimos_cuatro_digitos: ultimosCuatroSimulados,
                    // Podríamos añadir tipo_tarjeta y fecha_expiracion a la comprobación si quisiéramos
                }
            });
            if (!existingMetodo) {
                const countMetodos = await prismaClient_1.prisma.metodoPagoCliente.count({ where: { id_cliente: userId } });
                const esPrincipalNuevo = countMetodos === 0;
                if (esPrincipalNuevo) {
                    await prismaClient_1.prisma.metodoPagoCliente.updateMany({
                        where: { id_cliente: userId, es_principal: true },
                        data: { es_principal: false }
                    });
                }
                try {
                    await prismaClient_1.prisma.metodoPagoCliente.create({
                        data: {
                            id_cliente: userId,
                            // stripe_payment_method_id: null, // Ya no existe este campo o se deja null
                            tipo_tarjeta: tipoTarjetaSimulada, // Esto necesitaría una lógica de detección o ser un campo de entrada
                            ultimos_cuatro_digitos: ultimosCuatroSimulados,
                            fecha_expiracion: cardDetails.expiryDate, // MM/YY
                            es_principal: esPrincipalNuevo,
                            // No hay stripe_payment_method_id que guardar
                        },
                    });
                    console.log("SIMULACIÓN: 'Método de pago' (representación) guardado para el usuario.");
                }
                catch (dbError) {
                    console.error("SIMULACIÓN: Error al guardar representación del método de pago:", dbError);
                }
            }
            else {
                console.log("SIMULACIÓN: Representación de método de pago similar ya existe, no se guardó duplicado.");
            }
        }
        // 5. Registrar la venta
        await prismaClient_1.prisma.venta.create({
            data: {
                pedidoId,
                monto: Number(monto),
                fecha: new Date(),
            },
        });
        // 6. Enviar email de confirmación al cliente
        // (La lógica de envío de email se mantiene, asumiendo que no depende de detalles de Stripe)
        await enviarEmailConfirmacionCliente((_a = pedido.cliente) === null || _a === void 0 ? void 0 : _a.email, (_b = pedido.cliente) === null || _b === void 0 ? void 0 : _b.nombre, pedido);
        // 7. Enviar notificación interna
        // (La lógica de envío de email se mantiene)
        await enviarEmailNotificacionInterna(pedido);
        res.json({ message: 'Pago (simulado) procesado y venta registrada correctamente', pedidoId: pedido.id_pedido, estadoPedido: 'pagado' });
    }
    catch (err) {
        console.error('Error procesando el pago (simulado):', err);
        res.status(500).json({ message: 'Error procesando el pago (simulado)', error: err.message || err });
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
