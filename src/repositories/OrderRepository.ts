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

  async create(data: any) {
    return prisma.pedido.create({ data });
  }

  async update(id_pedido: number, data: any) {
    return prisma.pedido.update({ where: { id_pedido }, data });
  }

  async delete(id_pedido: number) {
    return prisma.pedido.delete({ where: { id_pedido } });
  }
}
