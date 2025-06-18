"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCart = getCart;
exports.addToCart = addToCart;
exports.clearCart = clearCart;
const prismaClient_1 = require("../prismaClient");
// Solo exportar los controladores implementados
async function getCart(req, res) {
    const userId = req.user.userId;
    // Validar que el email esté verificado
    const cliente = await prismaClient_1.prisma.cliente.findUnique({ where: { id_cliente: userId } });
    if (!(cliente === null || cliente === void 0 ? void 0 : cliente.email_verificado)) {
        return res.status(403).json({ message: 'Debes verificar tu email para ver el carrito.' });
    }
    const carrito = await prismaClient_1.prisma.carrito.findFirst({
        where: { id_cliente: userId },
        include: {
            items: {
                include: { producto: true }
            }
        }
    });
    // Filtrar items con producto válido y con id_producto válido
    const items = ((carrito === null || carrito === void 0 ? void 0 : carrito.items) || []).filter(item => item.producto && item.producto.id_producto);
    // Si hay ítems huérfanos, eliminarlos de la base de datos (limpieza automática)
    const orphanItems = ((carrito === null || carrito === void 0 ? void 0 : carrito.items) || []).filter(item => !item.producto || !item.producto.id_producto);
    if (orphanItems.length > 0) {
        await prismaClient_1.prisma.carritoItem.deleteMany({
            where: {
                id_item: { in: orphanItems.map(i => i.id_item) }
            }
        });
    }
    // Devolver siempre un array, nunca error por productos faltantes
    return res.json(items);
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
