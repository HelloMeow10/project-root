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
async function createProduct(req, res, next) {
    try {
        const newProduct = await productService.crearProducto(req.body);
        res.status(201).json(newProduct);
    }
    catch (err) {
        next(err);
    }
}
async function updateProduct(req, res, next) {
    try {
        const id = Number(req.params.id);
        const updated = await productService.actualizarProducto(id, req.body);
        res.status(200).json(updated);
    }
    catch (err) {
        next(err);
    }
}
async function deleteProduct(req, res, next) {
    try {
        const id = Number(req.params.id);
        await productService.eliminarProducto(id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
}
