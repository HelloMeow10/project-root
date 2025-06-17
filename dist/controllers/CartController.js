"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = void 0;
exports.getCart = getCart;
exports.addToCart = addToCart;
exports.updateCartItem = updateCartItem;
exports.removeCartItem = removeCartItem;
const db_1 = require("../config/db");
// Extend Express Request type (already defined in authMiddleware.ts)
// declare global {
//   namespace Express {
//     interface Request {
//       user?: { userId: number; tipo: 'cliente' | 'admin'; nombre: string };
//     }
//   }
// }
async function getCart(req, res) {
    var _a;
    let userId;
    try {
        if (!req.user || req.user.tipo !== 'cliente') {
            return res.status(401).json({ message: 'Acceso no autorizado. Solo clientes pueden acceder al carrito.' });
        }
        userId = req.user.userId;
        console.log(`Fetching cart for userId: ${userId}`);
        const carrito = await db_1.prisma.carrito.findFirst({
            where: { id_cliente: userId },
            include: {
                items: {
                    include: {
                        producto: true, // Quita "tipo: true"
                    },
                },
            },
        });
        const items = ((_a = carrito === null || carrito === void 0 ? void 0 : carrito.items) === null || _a === void 0 ? void 0 : _a.map((item) => (Object.assign(Object.assign({}, item), { producto: Object.assign(Object.assign({}, item.producto), { precio: Number(item.producto.precio) }) })))) || [];
        console.log(`Cart items fetched: ${JSON.stringify(items, null, 2)}`);
        res.json(items);
    }
    catch (error) {
        console.error(`getCart error for userId ${userId || 'unknown'}:`, error);
        res.status(500).json({ message: 'Error al cargar el carrito' });
    }
}
async function addToCart(req, res) {
    var _a, _b;
    let userId;
    try {
        if (!req.user || req.user.tipo !== 'cliente') {
            return res.status(401).json({ message: 'Acceso no autorizado. Solo clientes pueden añadir al carrito.' });
        }
        userId = req.user.userId;
        const { productId, cantidad } = req.body;
        if (!productId || !cantidad || cantidad < 1) {
            console.log(`Invalid addToCart request: productId=${productId}, cantidad=${cantidad}`);
            return res.status(400).json({ message: 'Invalid productId or cantidad' });
        }
        const producto = await db_1.prisma.producto.findUnique({
            where: { id_producto: productId },
        });
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        if (((_a = producto.stock) !== null && _a !== void 0 ? _a : 0) < cantidad) {
            return res.status(400).json({ message: `Stock insuficiente. Disponible: ${producto.stock}` });
        }
        let carrito = await db_1.prisma.carrito.findFirst({ where: { id_cliente: userId } });
        if (!carrito) {
            carrito = await db_1.prisma.carrito.create({
                data: { id_cliente: userId }, // userId is guaranteed to be a number
            });
            console.log(`Created new cart: ${carrito.id_carrito}`);
        }
        const existingItem = await db_1.prisma.carritoItem.findFirst({
            where: { id_carrito: carrito.id_carrito, id_producto: productId },
        });
        if (existingItem) {
            const totalCantidad = existingItem.cantidad + (cantidad || 1);
            if (((_b = producto.stock) !== null && _b !== void 0 ? _b : 0) < totalCantidad) {
                return res.status(400).json({ message: `Stock insuficiente. Disponible: ${producto.stock}` });
            }
            const item = await db_1.prisma.carritoItem.update({
                where: { id_item: existingItem.id_item },
                data: { cantidad: totalCantidad },
            });
            console.log(`Updated item: ${item.id_item}, new cantidad: ${item.cantidad}`);
            return res.status(200).json(item);
        }
        const item = await db_1.prisma.carritoItem.create({
            data: {
                id_carrito: carrito.id_carrito,
                id_producto: productId,
                cantidad: cantidad || 1,
            },
        });
        console.log(`Added new item: ${item.id_item}`);
        res.status(201).json(item);
    }
    catch (error) {
        console.error(`addToCart error for userId ${userId || 'unknown'}:`, error);
        res.status(500).json({ message: 'Error al agregar al carrito' });
    }
}
async function updateCartItem(req, res) {
    var _a;
    let userId;
    try {
        if (!req.user || req.user.tipo !== 'cliente') {
            return res.status(401).json({ message: 'Acceso no autorizado. Solo clientes pueden actualizar el carrito.' });
        }
        userId = req.user.userId;
        const { id } = req.params;
        const { cantidad } = req.body;
        if (!cantidad || cantidad < 1) {
            console.log(`Invalid updateCartItem request: id=${id}, cantidad=${cantidad}`);
            return res.status(400).json({ message: 'Invalid cantidad' });
        }
        const carrito = await db_1.prisma.carrito.findFirst({ where: { id_cliente: userId } });
        if (!carrito) {
            console.log(`Cart not found for userId: ${userId}`);
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }
        const item = await db_1.prisma.carritoItem.findFirst({
            where: { id_item: parseInt(id), id_carrito: carrito.id_carrito },
            include: { producto: true },
        });
        if (!item) {
            console.log(`Item not found: id_item=${id}, id_carrito=${carrito.id_carrito}`);
            return res.status(404).json({ message: 'Item no encontrado' });
        }
        if (((_a = item.producto.stock) !== null && _a !== void 0 ? _a : 0) < cantidad) {
            return res.status(400).json({ message: `Stock insuficiente. Disponible: ${item.producto.stock}` });
        }
        const updatedItem = await db_1.prisma.carritoItem.update({
            where: { id_item: parseInt(id) },
            data: { cantidad },
        });
        console.log(`Updated item: ${updatedItem.id_item}, cantidad: ${cantidad}`);
        res.json(updatedItem);
    }
    catch (error) {
        console.error(`updateCartItem error for userId ${userId || 'unknown'}:`, error);
        res.status(500).json({ message: 'Error al actualizar el item' });
    }
}
async function removeCartItem(req, res) {
    let userId;
    try {
        if (!req.user || req.user.tipo !== 'cliente') {
            return res.status(401).json({ message: 'Acceso no autorizado. Solo clientes pueden eliminar ítems.' });
        }
        userId = req.user.userId;
        const { id } = req.params;
        const carrito = await db_1.prisma.carrito.findFirst({ where: { id_cliente: userId } });
        if (!carrito) {
            console.log(`Cart not found for userId: ${userId}`);
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }
        const item = await db_1.prisma.carritoItem.findFirst({
            where: { id_item: parseInt(id), id_carrito: carrito.id_carrito },
        });
        if (!item) {
            console.log(`Item not found: id_item=${id}, id_carrito=${carrito.id_carrito}`);
            return res.status(404).json({ message: 'Item no encontrado' });
        }
        await db_1.prisma.carritoItem.delete({
            where: { id_item: parseInt(id) },
        });
        console.log(`Deleted item: ${id}`);
        res.json({ message: 'Item eliminado exitosamente' });
    }
    catch (error) {
        console.error(`removeCartItem error for userId ${userId || 'unknown'}:`, error);
        res.status(500).json({ message: 'Error al eliminar el item' });
    }
}
const clearCart = async (req, res) => {
    console.log('clearCart called. req.user:', req.user);
    try {
        if (!req.user || req.user.tipo !== 'cliente') {
            console.log('clearCart: acceso denegado', req.user);
            return res.status(403).json({ message: 'Acceso no autorizado. Solo clientes pueden vaciar su carrito.' });
        }
        const userId = req.user.userId;
        await db_1.prisma.carritoItem.deleteMany({
            where: {
                carrito: {
                    id_cliente: userId
                }
            }
        });
        res.json({ message: 'Carrito vaciado correctamente.' });
    }
    catch (err) {
        res.status(500).json({ message: 'Error al vaciar el carrito.' });
    }
};
exports.clearCart = clearCart;
