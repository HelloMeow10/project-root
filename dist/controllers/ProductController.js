"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProducts = getAllProducts;
exports.getProductById = getProductById;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
const ProductService_1 = require("../services/ProductService");
const productService = new ProductService_1.ProductService();
async function getAllProducts(req, res, next) {
    try {
        const productos = await productService.obtenerProductos();
        res.status(200).json(productos);
    }
    catch (err) {
        next(err);
    }
}
async function getProductById(req, res, next) {
    try {
        const id = Number(req.params.id);
        const producto = await productService.obtenerProductoPorId(id);
        res.status(200).json(producto);
    }
    catch (err) {
        next(err);
    }
}
async function createProduct(req, res) {
    try {
        const { nombre, tipo, precio, activo } = req.body;
        // Si no se envía activo, por defecto true
        const nuevoProducto = await productService.crearProducto({ nombre, tipo, precio, activo: activo !== undefined ? activo : true });
        res.status(201).json(nuevoProducto);
    }
    catch (err) {
        res.status(500).json({ message: 'Error al crear producto' });
    }
}
async function updateProduct(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: 'ID de producto inválido.' });
            return;
        }
        const { nombre, descripcion, precio, stock, activo, tipo } = req.body;
        const productoActualizado = await productService.actualizarProducto(id, { nombre, descripcion, precio, stock, activo, tipo });
        res.status(200).json(productoActualizado);
    }
    catch (err) {
        next(err); // Pass errors to the global error handler
    }
}
async function deleteProduct(req, res) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) { // Validate ID
            return res.status(400).json({ message: 'ID de producto inválido.' });
        }
        await productService.deleteProduct(id);
        res.status(204).send();
    }
    catch (err) { // Specify 'any' or a more specific error type
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
