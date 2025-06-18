// src/repositories/OrderRepository.ts
import { prisma } from '../config/db';

export class OrderRepository {
  async getAll() {
    return prisma.pedido.findMany({
      include: {
        cliente: true,
        items: true,
        pagos: true
      }
    });
  }

  async getById(id_pedido: number) {
    return prisma.pedido.findUnique({
      where: { id_pedido },
      include: {
        cliente: true,
        items: true,
        pagos: true
      }
    });
  }

  // Crea un pedido con items y pagos en una sola transacción
  async create(data: any) {
    return prisma.pedido.create({
      data: {
        ...data,
        items: data.items ? { create: data.items } : undefined,
        pagos: data.pagos ? { create: data.pagos } : undefined
      },
      include: {
        cliente: true,
        items: true,
        pagos: true
      }
    });
  }

  async update(id_pedido: number, data: any) {
    return prisma.pedido.update({ where: { id_pedido }, data });
  }

  async delete(id_pedido: number) {
    return prisma.pedido.delete({ where: { id_pedido } });
  }
}
