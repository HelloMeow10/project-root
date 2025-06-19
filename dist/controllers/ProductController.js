"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProducts = getAllProducts;
exports.getIndividualProducts = getIndividualProducts;
exports.eliminarComponenteDePaquete = eliminarComponenteDePaquete;
exports.getProductById = getProductById;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.agregarComponenteAPaquete = agregarComponenteAPaquete;
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
async function getIndividualProducts(req, res, next) {
    try {
        const productos = await productService.obtenerProductosIndividuales();
        res.status(200).json(productos);
    }
    catch (err) {
        next(err);
    }
}
async function eliminarComponenteDePaquete(req, res, next) {
    try {
        const id_paquete = Number(req.params.id_paquete);
        if (isNaN(id_paquete)) {
            return res.status(400).json({ message: 'ID de paquete inválido.' });
        }
        const id_producto_componente = Number(req.params.id_producto_componente);
        if (isNaN(id_producto_componente)) {
            return res.status(400).json({ message: 'ID de producto componente inválido.' });
        }
        const paqueteActualizado = await productService.eliminarComponenteDePaqueteServ(id_paquete, id_producto_componente);
        res.status(200).json(paqueteActualizado); // Return updated package
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
async function agregarComponenteAPaquete(req, res, next) {
    var _a;
    try {
        const id_paquete = Number(req.params.id_paquete);
        if (isNaN(id_paquete)) {
            return res.status(400).json({ message: 'ID de paquete inválido.' });
        }
        const id_producto_componente = Number(req.body.id_producto);
        if (isNaN(id_producto_componente)) {
            return res.status(400).json({ message: 'ID de producto componente inválido.' });
        }
        const cantidad = Number((_a = req.body.cantidad) !== null && _a !== void 0 ? _a : 1);
        if (isNaN(cantidad) || cantidad <= 0) {
            return res.status(400).json({ message: 'Cantidad inválida. Debe ser un número positivo.' });
        }
        const paqueteActualizado = await productService.agregarComponenteAPaqueteServ(id_paquete, id_producto_componente, cantidad);
        res.status(201).json(paqueteActualizado); // 201 for created detail, or 200 if just updating package
    }
    catch (err) {
        next(err);
    }
}
