// src/repositories/OrderRepository.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderRepository {
  async getAll() {
    return prisma.pedido.findMany({
      include: {
        producto: true,
        usuario: true,
        emails: true
      }
    });
  }

  async getById(id: number) {
    return prisma.pedido.findUnique({
      where: { id },
      include: {
        producto: true,
        usuario: true,
        emails: true
      }
    });
  }

  async create(data: any) {
    return prisma.pedido.create({
      data
    });
  }

  async update(id: number, data: any) {
    return prisma.pedido.update({
      where: { id },
      data
    });
  }

  async delete(id: number) {
    return prisma.pedido.delete({
      where: { id }
    });
  }
}
