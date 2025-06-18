// src/repositories/ProductRepository.ts
import { prisma } from '../config/db';

export class ProductRepository {
  // Devuelve todos los productos, incluyendo el tipo
  async findAll() {
    return await prisma.producto.findMany({
      include: { tipoProducto: true }
    });
  }

  // Busca un producto por su ID, incluyendo el tipo
  async findById(id_producto: number) {
    if (!id_producto || isNaN(Number(id_producto))) return null;
    return await prisma.producto.findUnique({
      where: { id_producto },
      include: { tipoProducto: true }
    });
  }

  // Crea un nuevo producto
  async create(data: any) {
    return await prisma.producto.create({ data, include: { tipoProducto: true } });
  }

  // Actualiza un producto existente
  async update(id_producto: number, data: any) {
    return await prisma.producto.update({ where: { id_producto }, data, include: { tipoProducto: true } });
  }

  // Elimina un producto
  async delete(id_producto: number) {
    return await prisma.producto.delete({ where: { id_producto } });
  }
}
