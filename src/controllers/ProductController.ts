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
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: 'ID de producto inválido.' });
      return;

    }
    const { nombre, descripcion, precio, stock, activo, tipo } = req.body;
    const productoActualizado = await productService.actualizarProducto(id, { nombre, descripcion, precio, stock, activo, tipo });
    res.status(200).json(productoActualizado);
  } catch (err) {
    next(err); // Pass errors to the global error handler
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { // Validate ID
      return res.status(400).json({ message: 'ID de producto inválido.' });
    }
    await productService.deleteProduct(id);
    res.status(204).send();
  } catch (err: any) { // Specify 'any' or a more specific error type
    console.error('Error in ProductController.deleteProduct:', err);
    if (err.message && err.message.includes('no encontrado')) { // Example of checking custom error
         return res.status(404).json({ message: 'Producto no encontrado para eliminar.' });
    }
    if (err.message && err.message.includes('referenciado')) { // Example
         return res.status(409).json({ message: 'Este producto no se puede eliminar porque está referenciado en otros registros (ej. paquetes, pedidos).' });
    }
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
}
