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
/**
 * Obtiene todos los productos.
 * @async
 * @function getAllProducts
 * @param {Request} req - El objeto de solicitud de Express.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con la lista de productos o un error.
 */
async function getAllProducts(req, res, next) {
    try {
        const productos = await productService.obtenerProductos();
        res.status(200).json(productos);
    }
    catch (err) {
        next(err);
    }
}
/**
 * Obtiene todos los productos que no son de tipo 'paquete' (productos individuales).
 * @async
 * @function getIndividualProducts
 * @param {Request} req - El objeto de solicitud de Express.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con la lista de productos individuales o un error.
 */
async function getIndividualProducts(req, res, next) {
    try {
        const productos = await productService.obtenerProductosIndividuales();
        res.status(200).json(productos);
    }
    catch (err) {
        next(err);
    }
}
/**
 * Elimina un producto componente de un paquete específico.
 * @async
 * @function eliminarComponenteDePaquete
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.params.id_paquete` y `req.params.id_producto_componente`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con el paquete actualizado o un error.
 */
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
/**
 * Obtiene un producto específico por su ID.
 * @async
 * @function getProductById
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.params.id`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con el producto o un error.
 */
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
/**
 * Crea un nuevo producto, incluyendo datos específicos del tipo si aplica (ej. Hospedaje, Pasaje).
 * @async
 * @function createProduct
 * @param {Request} req - El objeto de solicitud de Express. Espera en `req.body` los datos del producto,
 *                        incluyendo `nombre_tipo_producto` y opcionalmente objetos como `hospedaje`, `pasaje`, etc.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con el nuevo producto creado o un error.
 */
async function createProduct(req, res, next) {
    try {
        // El cuerpo de la solicitud ahora puede contener datos específicos del tipo
        // ej. req.body.hospedajeData, req.body.pasajeData, etc.
        // El servicio se encargará de la lógica de creación detallada.
        // Necesitamos pasar el 'nombre_tipo_producto' en lugar de 'tipo' (que era el id_tipo)
        // El servicio buscará el id_tipo basado en el nombre_tipo_producto.
        const { nombre, descripcion, precio, stock, activo, nombre_tipo_producto, hospedaje, pasaje, alquiler, auto } = req.body;
        if (!nombre || precio === undefined || !nombre_tipo_producto) {
            return res.status(400).json({ message: 'Nombre, precio y nombre_tipo_producto son requeridos.' });
        }
        const dataForService = {
            nombre,
            descripcion,
            precio: parseFloat(precio),
            stock: stock !== undefined ? parseInt(stock, 10) : null,
            activo: activo !== undefined ? activo : true,
            nombre_tipo_producto, // El servicio resolverá esto a id_tipo
            hospedaje, // Objeto con datos de hospedaje o undefined
            pasaje, // Objeto con datos de pasaje o undefined
            alquiler, // Objeto con datos de alquiler o undefined
            auto // Objeto con datos de auto o undefined
        };
        const nuevoProducto = await productService.crearProductoCompleto(dataForService);
        res.status(201).json(nuevoProducto);
    }
    catch (err) {
        if (err.message.includes('no encontrado') || err.message.includes('requerido') || err.message.includes('debe ser')) {
            return res.status(400).json({ message: err.message });
        }
        next(err); // Para errores inesperados
    }
}
/**
 * Actualiza un producto existente.
 * @async
 * @function updateProduct
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.params.id` y en `req.body` los campos a actualizar.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con el producto actualizado o un error.
 */
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
/**
 * Elimina un producto por su ID.
 * @async
 * @function deleteProduct
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.params.id`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Envía una respuesta con estado 204 (sin contenido) si tiene éxito, o un error.
 */
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
/**
 * Agrega un producto componente a un paquete existente.
 * @async
 * @function agregarComponenteAPaquete
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.params.id_paquete` y en `req.body`: `id_producto` (del componente) y `cantidad`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con el paquete actualizado o un error.
 */
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
