"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentActivity = exports.getSalesByMonth = exports.getDashboardStats = void 0;
exports.getTransactions = getTransactions;
const prismaClient_1 = require("../prismaClient");
async function getTransactions(req, res) {
    try {
        const transactions = await prismaClient_1.prisma.pedido.findMany({
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
const getDashboardStats = async (req, res) => {
    try {
        const totalClientes = await prismaClient_1.prisma.cliente.count();
        const totalEmpleados = await prismaClient_1.prisma.usuarioInterno.count();
        const totalVentas = await prismaClient_1.prisma.venta.count();
        const ingresosTotales = await prismaClient_1.prisma.venta.aggregate({
            _sum: { monto: true }
        });
        res.json({
            totalClientes,
            totalEmpleados,
            totalVentas,
            ingresosTotales: ingresosTotales._sum.monto || 0
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Error al obtener estadísticas del dashboard' });
    }
};
exports.getDashboardStats = getDashboardStats;
const getSalesByMonth = async (req, res) => {
    try {
        const ventas = await prismaClient_1.prisma.venta.findMany({
            select: { fecha: true, monto: true }
        });
        // Agrupa por mes/año
        const monthly = {};
        ventas.forEach(v => {
            const date = new Date(v.fecha);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthly[key])
                monthly[key] = 0;
            monthly[key] += Number(v.monto || 0);
        });
        const labels = Object.keys(monthly).sort();
        const data = labels.map(l => monthly[l]);
        res.json({ labels, data });
    }
    catch (err) {
        res.status(500).json({ message: 'Error al obtener ventas por mes' });
    }
};
exports.getSalesByMonth = getSalesByMonth;
const getRecentActivity = async (req, res) => {
    try {
        // Últimos 5 pedidos
        const pedidos = await prismaClient_1.prisma.pedido.findMany({
            orderBy: { fecha_pedido: 'desc' },
            take: 5,
            include: {
                cliente: { select: { nombre: true, apellido: true, email: true } },
                items: true
            }
        });
        // Últimos 5 usuarios registrados
        const usuarios = await prismaClient_1.prisma.cliente.findMany({
            orderBy: { fecha_registro: 'desc' },
            take: 5,
            select: { nombre: true, apellido: true, email: true, fecha_registro: true }
        });
        res.json({ pedidos, usuarios });
    }
    catch (err) {
        res.status(500).json({ message: 'Error al obtener actividad reciente' });
    }
};
exports.getRecentActivity = getRecentActivity;
