"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCart = getCart;
exports.addToCart = addToCart;
exports.clearCart = clearCart;
const prismaClient_1 = require("../prismaClient");
async function getCart(req, res) {
    const userId = req.user.userId;
    const carrito = await prismaClient_1.prisma.carrito.findFirst({
        where: { id_cliente: userId },
        include: {
            items: {
                include: { producto: true }
            }
        }
    });
    res.json((carrito === null || carrito === void 0 ? void 0 : carrito.items) || []);
}
async function addToCart(req, res) {
    const userId = req.user.userId;
    const { productId, cantidad } = req.body;
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
