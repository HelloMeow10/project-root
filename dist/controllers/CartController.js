"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCart = getCart;
exports.addToCart = addToCart;
exports.updateCartItem = updateCartItem;
exports.removeCartItem = removeCartItem;
exports.clearCart = clearCart;
const prismaClient_1 = require("../prismaClient");
/**
 * Obtiene el contenido del carrito del usuario actual.
 * Valida que el email del cliente esté verificado.
 * Limpia items huérfanos del carrito si el producto asociado ya no existe.
 * @async
 * @function getCart
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Envía una respuesta JSON con los items del carrito o un error.
 */
async function getCart(req, res) {
    var _a, _b, _c, _d;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ message: 'No autenticado' });
        // Buscar el carrito del usuario, incluyendo producto, tipoProducto y config de avión si es vuelo
        const carrito = await prismaClient_1.prisma.carrito.findFirst({
            where: { id_cliente: userId },
            include: {
                items: {
                    include: {
                        producto: {
                            include: {
                                tipoProducto: true,
                                pasaje: {
                                    include: {
                                        avionConfig: {
                                            include: {
                                                asientos: true, // Only asientos is a valid relation
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!carrito)
            return res.status(200).json([]);
        const itemsParaFrontend = [];
        const itemsHuérfanos = [];
        // Use a type assertion to avoid TS error if needed
        const items = (carrito === null || carrito === void 0 ? void 0 : carrito.items) || [];
        for (const item of items) {
            // Si el producto fue eliminado, marcar para limpiar
            if (!item.producto) {
                itemsHuérfanos.push(item.id_item);
                continue;
            }
            const itemParaFrontend = Object.assign({}, item);
            let precioItemActual = item.producto.precio;
            let detalles_vuelo_populados = {};
            // Procesar solo si es vuelo y tiene detalles
            if (((_b = item.producto.tipoProducto) === null || _b === void 0 ? void 0 : _b.nombre) === 'vuelo' &&
                item.detalles_vuelo_json) {
                try {
                    const detalles = JSON.parse(item.detalles_vuelo_json);
                    // --- CLASE DE SERVICIO (desde tipoAsientoBase del asiento seleccionado) ---
                    let claseServicio = null;
                    let asientoSeleccionado = null;
                    const asientos = (_d = (_c = item.producto.pasaje) === null || _c === void 0 ? void 0 : _c.avionConfig) === null || _d === void 0 ? void 0 : _d.asientos;
                    if (detalles.id_asiento &&
                        Array.isArray(asientos)) {
                        asientoSeleccionado = asientos.find((a) => a.id_asiento === detalles.id_asiento);
                    }
                    if (asientoSeleccionado && asientoSeleccionado.tipoAsientoBase) {
                        claseServicio = asientoSeleccionado.tipoAsientoBase;
                        if (claseServicio.multiplicador_precio) {
                            precioItemActual *= Number(claseServicio.multiplicador_precio);
                        }
                        detalles_vuelo_populados.nombre_clase_servicio = claseServicio.nombre;
                    }
                    else {
                        detalles_vuelo_populados.nombre_clase_servicio = null;
                    }
                    // --- ASIENTO SELECCIONADO ---
                    if (asientoSeleccionado) {
                        if (asientoSeleccionado.precio_adicional_base) {
                            precioItemActual += Number(asientoSeleccionado.precio_adicional_base);
                        }
                        // Build seat code from fila and columna
                        detalles_vuelo_populados.info_asiento_seleccionado = `${asientoSeleccionado.fila}${asientoSeleccionado.columna}`;
                    }
                    else {
                        detalles_vuelo_populados.info_asiento_seleccionado = null;
                    }
                    // --- EQUIPAJE ADICIONAL ---
                    // No direct relation from avionConfig, so skip or handle separately if needed
                    detalles_vuelo_populados.info_equipaje_seleccionado = [];
                    if (Array.isArray(detalles.selecciones_equipaje)) {
                        for (const eqSel of detalles.selecciones_equipaje) {
                            // You may need to fetch OpcionEquipaje separately if you want names/prices
                            detalles_vuelo_populados.info_equipaje_seleccionado.push({
                                nombre: null, // Not available here
                                cantidad: eqSel.cantidad || 1,
                                precio_unitario: 0,
                                precio_total: 0,
                            });
                        }
                    }
                }
                catch (e) {
                    // Si el JSON está corrupto, ignorar detalles
                    detalles_vuelo_populados = {};
                }
            }
            // Calcular precio total (incluye cantidad)
            itemParaFrontend.precio_total_item_calculado = precioItemActual * item.cantidad;
            itemParaFrontend.detalles_vuelo_populados = detalles_vuelo_populados;
            itemsParaFrontend.push(itemParaFrontend);
        }
        // Limpiar items huérfanos
        if (itemsHuérfanos.length > 0) {
            await prismaClient_1.prisma.carritoItem.deleteMany({ where: { id_item: { in: itemsHuérfanos } } });
        }
        res.status(200).json(itemsParaFrontend);
    }
    catch (error) {
        console.error('Error al obtener carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
/**
 * Agrega un producto al carrito del usuario actual o actualiza su cantidad si ya existe.
 * Valida que el email del cliente esté verificado y que el producto exista y esté activo.
 * Verifica el stock del producto.
 * @async
 * @function addToCart
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId` y en `req.body`: `productId` y `cantidad` (opcional, default 1).
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Envía una respuesta JSON con el item del carrito creado/actualizado o un error.
 */
async function addToCart(req, res) {
    const userId = req.user.userId;
    // Validar que el email esté verificado
    const cliente = await prismaClient_1.prisma.cliente.findUnique({ where: { id_cliente: userId } });
    if (!(cliente === null || cliente === void 0 ? void 0 : cliente.email_verificado)) {
        return res.status(403).json({ message: 'Debes verificar tu email antes de agregar productos al carrito.' });
    }
    // Solo una declaración de productId y cantidad
    const { productId, cantidad: cantidadSolicitada, detallesVuelo } = req.body;
    // Validación explícita de productId
    if (!productId || isNaN(Number(productId))) {
        return res.status(400).json({ message: 'El campo productId es requerido y debe ser un número válido.' });
    }
    const idProducto = Number(productId);
    // Validación de cantidad
    const cantidadFinal = Number(cantidadSolicitada) || 1;
    if (!Number.isInteger(cantidadFinal) || cantidadFinal <= 0) {
        return res.status(400).json({ message: 'La cantidad debe ser un entero positivo.' });
    }
    // Verificar que el producto exista y esté activo
    const producto = await prismaClient_1.prisma.producto.findUnique({
        where: { id_producto: idProducto },
    });
    if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado.' });
    }
    if (!producto.activo) {
        return res.status(400).json({ message: 'Este producto ya no está disponible.' });
    }
    // Busca o crea el carrito del usuario (solo una vez)
    let carrito = await prismaClient_1.prisma.carrito.findFirst({ where: { id_cliente: userId } });
    if (!carrito) {
        carrito = await prismaClient_1.prisma.carrito.create({ data: { id_cliente: userId } });
    }
    // Verificar si el item ya existe en el carrito
    let itemEnCarrito = await prismaClient_1.prisma.carritoItem.findFirst({
        where: {
            id_carrito: carrito.id_carrito,
            id_producto: idProducto,
        },
    });
    // Serializar detallesVuelo si viene presente
    let detallesVueloJson = null;
    if (detallesVuelo !== undefined) {
        if (detallesVuelo === null) {
            detallesVueloJson = null;
        }
        else {
            try {
                detallesVueloJson = JSON.stringify(detallesVuelo);
            }
            catch (e) {
                return res.status(400).json({ message: 'Error al serializar detallesVuelo.' });
            }
        }
    }
    if (itemEnCarrito) {
        // Producto ya existe en el carrito, actualizar cantidad y/o detalles_vuelo_json
        const nuevaCantidad = itemEnCarrito.cantidad + cantidadFinal;
        if (producto.stock !== null && nuevaCantidad > producto.stock) {
            return res.status(400).json({ message: `Stock insuficiente. Solo quedan ${producto.stock} unidades.` });
        }
        itemEnCarrito = await prismaClient_1.prisma.carritoItem.update({
            where: { id_item: itemEnCarrito.id_item },
            data: Object.assign({ cantidad: nuevaCantidad }, (detallesVuelo !== undefined ? { detalles_vuelo_json: detallesVueloJson } : {})),
        });
        res.status(200).json(itemEnCarrito);
    }
    else {
        // Producto no existe en el carrito, crear nuevo item
        if (producto.stock !== null && cantidadFinal > producto.stock) {
            return res.status(400).json({ message: `Stock insuficiente. Solo quedan ${producto.stock} unidades.` });
        }
        const nuevoItem = await prismaClient_1.prisma.carritoItem.create({
            data: Object.assign({ id_carrito: carrito.id_carrito, id_producto: idProducto, cantidad: cantidadFinal }, (detallesVuelo !== undefined ? { detalles_vuelo_json: detallesVueloJson } : {})),
        });
        res.status(201).json(nuevoItem);
    }
}
/**
 * Actualiza la cantidad de un item específico en el carrito del usuario.
 * Si la cantidad es 0, elimina el item.
 * Valida el stock del producto.
 * @async
 * @function updateCartItem
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId`, `req.params.itemId` y en `req.body`: `cantidad`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Envía una respuesta JSON con el item actualizado o un mensaje de éxito/error.
 */
async function updateCartItem(req, res) {
    const userId = req.user.userId;
    const itemId = parseInt(req.params.itemId, 10);
    const { cantidad } = req.body;
    if (isNaN(itemId)) {
        return res.status(400).json({ message: 'ID de item inválido.' });
    }
    if (cantidad === undefined || !Number.isInteger(cantidad) || cantidad < 0) {
        return res.status(400).json({ message: 'La cantidad debe ser un entero no negativo.' });
    }
    try {
        const item = await prismaClient_1.prisma.carritoItem.findFirst({
            where: { id_item: itemId, carrito: { id_cliente: userId } },
            include: { producto: true }
        });
        if (!item) {
            return res.status(404).json({ message: 'Item del carrito no encontrado o no pertenece al usuario.' });
        }
        if (cantidad === 0) {
            await prismaClient_1.prisma.carritoItem.delete({ where: { id_item: itemId } });
            return res.status(200).json({ message: 'Item eliminado del carrito.' });
        }
        if (item.producto.stock !== null && cantidad > item.producto.stock) {
            return res.status(400).json({ message: `Stock insuficiente. Solo quedan ${item.producto.stock} unidades.` });
        }
        const updatedItem = await prismaClient_1.prisma.carritoItem.update({
            where: { id_item: itemId },
            data: { cantidad },
        });
        res.status(200).json(updatedItem);
    }
    catch (error) {
        console.error('Error al actualizar item del carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
/**
 * Elimina un item específico del carrito del usuario.
 * @async
 * @function removeCartItem
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId` y `req.params.itemId`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Envía una respuesta JSON con un mensaje de éxito o un error.
 */
async function removeCartItem(req, res) {
    const userId = req.user.userId;
    const itemId = parseInt(req.params.itemId, 10);
    if (isNaN(itemId)) {
        return res.status(400).json({ message: 'ID de item inválido.' });
    }
    try {
        const item = await prismaClient_1.prisma.carritoItem.findFirst({
            where: { id_item: itemId, carrito: { id_cliente: userId } },
        });
        if (!item) {
            return res.status(404).json({ message: 'Item del carrito no encontrado o no pertenece al usuario.' });
        }
        await prismaClient_1.prisma.carritoItem.delete({ where: { id_item: itemId } });
        res.status(200).json({ message: 'Item eliminado del carrito exitosamente.' });
    }
    catch (error) {
        console.error('Error al eliminar item del carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
/**
 * Vacía todos los items del carrito del usuario actual.
 * @async
 * @function clearCart
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Envía una respuesta JSON con un mensaje de éxito o un error.
 */
async function clearCart(req, res) {
    try {
        const userId = req.user.userId;
        const carrito = await prismaClient_1.prisma.carrito.findFirst({ where: { id_cliente: userId } });
        if (!carrito)
            return res.status(200).json({ message: 'Carrito ya vacío' });
        await prismaClient_1.prisma.carritoItem.deleteMany({ where: { id_carrito: carrito.id_carrito } });
        res.json({ message: 'Carrito vaciado exitosamente' });
    }
    catch (err) {
        console.error('Error al vaciar carrito:', err);
        res.status(500).json({ message: 'Error al vaciar carrito', error: err });
    }
}
