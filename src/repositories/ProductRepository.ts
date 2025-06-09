// src/repositories/ProductRepository.ts
import { prisma } from '../config/db';
import { Producto } from '../models/producto';

export class ProductRepository {
  // Devuelve todos los productos
  async findAll(): Promise<Producto[]> {
    return await prisma.producto.findMany();
  }

  // Busca un producto por su ID
  async findById(id: number): Promise<Producto | null> {
    return await prisma.producto.findUnique({ where: { id } });
  }

  // Crea un nuevo producto
  async create(data: Omit<Producto, 'id'>): Promise<Producto> {
    return await prisma.producto.create({ data });
  }

  // Actualiza un producto existente
  async update(id: number, data: Partial<Producto>): Promise<Producto> {
    return await prisma.producto.update({ where: { id }, data });
  }

  // Elimina un producto
  async delete(id: number): Promise<Producto> {
    return await prisma.producto.delete({ where: { id } });
  }
}
