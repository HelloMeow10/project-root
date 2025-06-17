"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPayment = processPayment;
const prismaClient_1 = require("../prismaClient");
async function processPayment(req, res) {
    try {
        const { pedidoId, monto } = req.body;
        // 1. Validar pedido
        const pedido = await prismaClient_1.prisma.pedido.findUnique({ where: { id_pedido: pedidoId } });
        if (!pedido)
            return res.status(404).json({ message: 'Pedido no encontrado' });
        if (pedido.estado === 'pagado')
            return res.status(400).json({ message: 'El pedido ya está pagado' });
        if (Number(pedido.total) !== Number(monto))
            return res.status(400).json({ message: 'El monto no coincide con el pedido' });
        // 2. Procesar pago (simulado)
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
        res.json({ message: 'Pago procesado y venta registrada correctamente' });
    }
    catch (err) {
        res.status(500).json({ message: 'Error procesando el pago', error: err });
    }
}
