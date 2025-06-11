"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = getTransactions;
async function getTransactions(req, res) {
    try {
        const transactions = await prisma.transaction.findMany({
            include: { user: true, products: true },
        });
        res.status(200).json(transactions);
    }
    catch (err) {
        res.status(500).json({ message: 'Error al obtener transacciones' });
    }
}
