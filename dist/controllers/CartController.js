"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCart = getCart;
exports.addToCart = addToCart;
exports.updateCartItem = updateCartItem;
exports.removeCartItem = removeCartItem;
exports.clearCart = clearCart;
const prismaClient_1 = require("../prismaClient");
// Solo exportar los controladores implementados
async function getCart(req, res) {
    console.log('NEW GETCART: Executing getCart function - Start');
    const userId = req.user.userId;
    const cliente = await prismaClient_1.prisma.cliente.findUnique({ where: { id_cliente: userId } });
    if (!(cliente === null || cliente === void 0 ? void 0 : cliente.email_verificado)) {
        console.log('NEW GETCART: Email not verified, returning 403');
        return res.status(403).json({ message: 'Debes verificar tu email para ver el carrito.' });
    }
    // 1. Fetch the user's cart and its basic items
    const carrito = await prismaClient_1.prisma.carrito.findFirst({
        where: { id_cliente: userId },
        include: {
            items: true // Just CarritoItems, no deep product include yet
        }
    });
    if (!carrito || !carrito.items || carrito.items.length === 0) {
        console.log('NEW GETCART: Returning data:', []);
        return res.json([]); // Return empty array if no cart or no items
    }
    // 2. Extract all unique product IDs from cart items
    const productoIds = [...new Set(carrito.items.map(item => item.id_producto))];
    if (productoIds.length === 0) {
        // This case should ideally not be reached if carrito.items was not empty,
        // but as a safeguard:
        if (carrito.items.length > 0) {
            // If there were items but no product IDs (e.g. all items had null/undefined id_producto)
            // then these are all orphans.
            const orphanItemIds = carrito.items.map(i => i.id_item);
            if (orphanItemIds.length > 0) {
                await prismaClient_1.prisma.carritoItem.deleteMany({
                    where: { id_item: { in: orphanItemIds } }
                });
            }
        }
        console.log('NEW GETCART: Returning data:', []);
        return res.json([]);
    }
    // 3. Fetch all corresponding products with their types
    const productos = await prismaClient_1.prisma.producto.findMany({
        where: {
            id_producto: { in: productoIds }
        },
        include: {
            tipoProducto: true // Include the product type
        }
    });
    // 4. Create a map of productId to Product for easy lookup
    const productoMap = new Map(productos.map(p => [p.id_producto, p]));
    const validItems = [];
    const orphanItemIds = [];
    // 5. Iterate through original cart items, validate, and build response
    for (const item of carrito.items) {
        const productoDetallado = productoMap.get(item.id_producto);
        if (productoDetallado) {
            // Product exists, create the item structure the frontend expects
            validItems.push(Object.assign(Object.assign({}, item), { producto: productoDetallado // Add the full product details
             }));
        }
        else {
            // Product not found, mark this CarritoItem as an orphan
            orphanItemIds.push(item.id_item);
        }
    }
    // 6. Delete orphan CarritoItems
    if (orphanItemIds.length > 0) {
        await prismaClient_1.prisma.carritoItem.deleteMany({
            where: {
                id_item: { in: orphanItemIds }
            }
        });
        console.log(`Deleted ${orphanItemIds.length} orphan cart items.`);
    }
    // 7. Return only the valid items
    console.log('NEW GETCART: Returning data:', validItems);
    return res.json(validItems);
}
async function addToCart(req, res) {
    const userId = req.user.userId;
    // Validar que el email esté verificado
    const cliente = await prismaClient_1.prisma.cliente.findUnique({ where: { id_cliente: userId } });
    if (!(cliente === null || cliente === void 0 ? void 0 : cliente.email_verificado)) {
        return res.status(403).json({ message: 'Debes verificar tu email antes de agregar productos al carrito.' });
    }
    // Solo una declaración de productId y cantidad
    const { productId, cantidad: cantidadSolicitada } = req.body;
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
    if (itemEnCarrito) {
        // Producto ya existe en el carrito, actualizar cantidad
        const nuevaCantidad = itemEnCarrito.cantidad + cantidadFinal;
        if (producto.stock !== null && nuevaCantidad > producto.stock) {
            return res.status(400).json({ message: `Stock insuficiente. Solo quedan ${producto.stock} unidades.` });
        }
        itemEnCarrito = await prismaClient_1.prisma.carritoItem.update({
            where: { id_item: itemEnCarrito.id_item },
            data: { cantidad: nuevaCantidad },
        });
        res.status(200).json(itemEnCarrito);
    }
    else {
        // Producto no existe en el carrito, crear nuevo item
        if (producto.stock !== null && cantidadFinal > producto.stock) {
            return res.status(400).json({ message: `Stock insuficiente. Solo quedan ${producto.stock} unidades.` });
        }
        const nuevoItem = await prismaClient_1.prisma.carritoItem.create({
            data: {
                id_carrito: carrito.id_carrito,
                id_producto: idProducto,
                cantidad: cantidadFinal,
            },
        });
        res.status(201).json(nuevoItem);
    }
}
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
