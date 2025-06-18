import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';

const orderService = new OrderService();

export async function getAllOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await orderService.obtenerPedidos();
    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const order = await orderService.obtenerPedidoPorId(id);
    // Solo el dueño o admin puede ver el pedido
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
    if (req.user?.tipo !== 'admin' && order.cliente?.id_cliente !== req.user?.userId) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const newOrder = await orderService.crearPedido(req.body);
    res.status(201).json(newOrder);
  } catch (err) {
    next(err);
  }
}

export async function updateOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const order = await orderService.obtenerPedidoPorId(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
    if (req.user?.tipo !== 'admin' && order.cliente?.id_cliente !== req.user?.userId) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    const updated = await orderService.actualizarPedido(id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const order = await orderService.obtenerPedidoPorId(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
    if (req.user?.tipo !== 'admin' && order.cliente?.id_cliente !== req.user?.userId) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    await orderService.eliminarPedido(id);
    res.json({ message: 'Pedido eliminado' });
  } catch (err) {
    next(err);
  }
}