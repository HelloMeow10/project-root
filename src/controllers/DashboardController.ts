import { Request, Response } from 'express';
import { prisma } from '../prismaClient';

export async function getTransactions(req: Request, res: Response) {
  try {
    const transactions = await prisma.pedido.findMany({
      include: {
        cliente: true,
        items: { include: { producto: true } },
        pagos: true
      }
    });
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener transacciones' });
  }
}

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalClientes = await prisma.cliente.count();
    const totalEmpleados = await prisma.usuarioInterno.count();
    const totalVentas = await prisma.venta.count();
    const ingresosTotales = await prisma.venta.aggregate({
      _sum: { monto: true }
    });

    res.json({
      totalClientes,
      totalEmpleados,
      totalVentas,
      ingresosTotales: ingresosTotales._sum.monto || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener estadísticas del dashboard' });
  }
};

export const getSalesByMonth = async (req: Request, res: Response) => {
  try {
    const ventas = await prisma.venta.findMany({
      select: { fecha: true, monto: true }
    });

    // Agrupa por mes/año
    const monthly: { [key: string]: number } = {};
    ventas.forEach(v => {
      const date = new Date(v.fecha);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = 0;
      monthly[key] += Number(v.monto || 0);
    });

    const labels = Object.keys(monthly).sort();
    const data = labels.map(l => monthly[l]);

    res.json({ labels, data });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener ventas por mes' });
  }
};

export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    // Últimos 5 pedidos
    const pedidos = await prisma.pedido.findMany({
      orderBy: { fecha_pedido: 'desc' },
      take: 5,
      include: {
        cliente: { select: { nombre: true, apellido: true, email: true } },
        items: true
      }
    });

    // Últimos 5 usuarios registrados
    const usuarios = await prisma.cliente.findMany({
      orderBy: { fecha_registro: 'desc' },
      take: 5,
      select: { nombre: true, apellido: true, email: true, fecha_registro: true }
    });

    res.json({ pedidos, usuarios });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener actividad reciente' });
  }
}