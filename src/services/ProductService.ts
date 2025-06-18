// src/services/ProductService.ts
import { ProductRepository } from '../repositories/ProductRepository';
import { Producto } from '../models/producto';

function mapPrismaProductoToProducto(prismaProducto: any): Producto {
  return {
    id_producto: prismaProducto.id_producto,
    nombre: prismaProducto.nombre,
    tipo: prismaProducto.tipoProducto?.nombre, // Deriva el nombre del tipo si está incluido
    descripcion: prismaProducto.descripcion,
    precio: prismaProducto.precio,
    stock: prismaProducto.stock,
    activo: prismaProducto.activo,
    id_tipo: prismaProducto.id_tipo
  };
}

export class ProductService {
  private repo = new ProductRepository();

  // Obtiene todos los productos disponibles
  async obtenerProductos(): Promise<Producto[]> {
    const productos = await this.repo.findAll();
    return productos.map(mapPrismaProductoToProducto);
  }

  // Obtiene un producto por ID, lanza error si no existe
  async obtenerProductoPorId(id: number): Promise<Producto> {
    const producto = await this.repo.findById(id);
    if (!producto) throw new Error('Producto no encontrado');
    return mapPrismaProductoToProducto(producto);
  }

  // Crea un producto, validando datos (ejemplo simple)
  async crearProducto(data: Omit<Producto, 'id_producto'>): Promise<Producto> {
    if (data.precio < 0) throw new Error('El precio debe ser positivo');
    if (!data.id_tipo) throw new Error('id_tipo es requerido');
    // No se debe mapear tipo string a id_tipo aquí, debe venir del frontend o lógica superior
    const prismaData = { ...data };
    const producto = await this.repo.create(prismaData);
    return mapPrismaProductoToProducto(producto);
  }

  // Elimina un producto
  async deleteProduct(id: number) {
    return this.repo.delete(id);
  }
}
