// src/services/ProductService.ts
import { ProductRepository } from '../repositories/ProductRepository';
import { Producto } from '../models/producto';

function mapPrismaProductoToProducto(prismaProducto: any): Producto {
  return {
    id: prismaProducto.id_producto,
    nombre: prismaProducto.nombre,
    descripcion: prismaProducto.descripcion,
    precio: prismaProducto.precio,
    stock: prismaProducto.stock,
    // agrega otros campos si tu interfaz los tiene
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
  async crearProducto(data: Omit<Producto, 'id'>): Promise<Producto> {
    if (data.precio < 0) throw new Error('El precio debe ser positivo');
    // Prisma espera id_tipo, debes adaptar si es necesario
    const prismaData = { ...data, id_tipo: 1 }; // Ajusta id_tipo según corresponda
    const producto = await this.repo.create(prismaData);
    return mapPrismaProductoToProducto(producto);
  }

  // Actualiza un producto existente
  async actualizarProducto(id: number, data: Partial<Producto>): Promise<Producto> {
    const producto = await this.repo.update(id, data);
    return mapPrismaProductoToProducto(producto);
  }

  // Elimina un producto
  async eliminarProducto(id: number): Promise<Producto> {
    const producto = await this.repo.delete(id);
    return mapPrismaProductoToProducto(producto);
  }
}
