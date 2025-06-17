// src/controllers/ProductController.ts
import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/ProductService';

const productService = new ProductService();

export async function getAllProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const productos = await productService.obtenerProductos();
    res.status(200).json(productos);
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const producto = await productService.obtenerProductoPorId(id);
    res.status(200).json(producto);
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const { nombre, tipo, precio, activo } = req.body;
    // Si no se envía activo, por defecto true
    const nuevoProducto = await productService.crearProducto({ nombre, tipo, precio, activo: activo !== undefined ? activo : true });
    res.status(201).json(nuevoProducto);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear producto' });
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // ... lógica para actualizar producto ...
    res.json({ message: 'Producto actualizado' });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await productService.deleteProduct(id); // Usar el método correcto
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
}
