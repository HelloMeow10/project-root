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
        // ... lógica para actualizar producto ...
        res.json({ message: 'Producto actualizado' });
    }
    catch (err) {
        next(err);
    }
}
async function deleteProduct(req, res) {
    try {
        const id = Number(req.params.id);
        await productService.deleteProduct(id); // Usar el método correcto
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ message: 'Error al eliminar producto' });
    }
}
