// src/repositories/OrderRepository.ts
import { prisma } from '../config/db';
import { Pedido } from '../models/pedido';

export class OrderRepository {
  async findAll(): Promise<Pedido[]> {
    return await prisma.pedido.findMany();
  }
  async findById(id: number): Promise<Pedido | null> {
    return await prisma.pedido.findUnique({ where: { id } });
  }
  async create(data: Omit<Pedido, 'id' | 'fecha' | 'total'> & { fecha?: Date }): Promise<Pedido> {
    // Calcular total o agregar lógica adicional si es necesario
    return await prisma.pedido.create({ data });
  }
  // Resto de métodos (update, delete) similares...
}
