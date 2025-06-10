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
    const updated = await orderService.actualizarPedido(id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await orderService.eliminarPedido(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}