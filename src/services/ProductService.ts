// src/services/ProductService.ts
import { ProductRepository } from '../repositories/ProductRepository';
import { Producto } from '../models/producto';

export class ProductService {
  private repo = new ProductRepository();

  // Obtiene todos los productos disponibles
  async obtenerProductos(): Promise<Producto[]> {
    return await this.repo.findAll();
  }

  // Obtiene un producto por ID, lanza error si no existe
  async obtenerProductoPorId(id: number): Promise<Producto> {
    const producto = await this.repo.findById(id);
    if (!producto) throw new Error('Producto no encontrado');
    return producto;
  }

  // Crea un producto, validando datos (ejemplo simple)
  async crearProducto(data: Omit<Producto, 'id'>): Promise<Producto> {
    if (data.precio < 0) throw new Error('El precio debe ser positivo');
    return await this.repo.create(data);
  }

  // Actualiza un producto existente
  async actualizarProducto(id: number, data: Partial<Producto>): Promise<Producto> {
    return await this.repo.update(id, data);
  }

  // Elimina un producto
  async eliminarProducto(id: number): Promise<Producto> {
    return await this.repo.delete(id);
  }
}
