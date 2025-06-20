"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCart = getCart;
exports.addToCart = addToCart;
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
    const { productId, cantidad } = req.body;
    // Validación explícita de productId
    if (!productId || isNaN(Number(productId))) {
        return res.status(400).json({ message: 'El campo productId es requerido y debe ser un número válido.' });
    }
    // Busca o crea el carrito del usuario
    let carrito = await prismaClient_1.prisma.carrito.findFirst({ where: { id_cliente: userId } });
    if (!carrito) {
        carrito = await prismaClient_1.prisma.carrito.create({ data: { id_cliente: userId } });
    }
    // Agrega el producto al carrito
    const item = await prismaClient_1.prisma.carritoItem.create({
        data: {
            id_carrito: carrito.id_carrito,
            id_producto: productId,
            cantidad: cantidad || 1
        }
    });
    res.status(201).json(item);
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
