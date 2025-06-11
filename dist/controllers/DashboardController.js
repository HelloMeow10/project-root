"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = getTransactions;
const db_1 = require("../config/db");
async function getTransactions(req, res) {
    try {
        const transactions = await db_1.prisma.pedido.findMany({
            include: {
                cliente: true,
                items: { include: { producto: true } },
                pagos: true
            }
        });
        res.status(200).json(transactions);
    }
    catch (err) {
        res.status(500).json({ message: 'Error al obtener transacciones' });
    }
}
