// src/repositories/ProductRepository.ts
import { prisma } from '../config/db';

export class ProductRepository {
  // Devuelve todos los productos
  async findAll() {
    return await prisma.producto.findMany();
  }

  // Busca un producto por su ID
  async findById(id_producto: number) {
    return await prisma.producto.findUnique({ where: { id_producto } });
  }

  // Crea un nuevo producto
  async create(data: any) {
    return await prisma.producto.create({ data });
  }

  // Actualiza un producto existente
  async update(id_producto: number, data: any) {
    return await prisma.producto.update({ where: { id_producto }, data });
  }

  // Elimina un producto
  async delete(id_producto: number) {
    return await prisma.producto.delete({ where: { id_producto } });
  }
}
