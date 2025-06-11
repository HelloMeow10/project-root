"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToCart = addToCart;
const db_1 = require("../config/db");
async function addToCart(req, res) {
    const { productId, quantity } = req.body;
    const userId = req.user.id;
    try {
        const cartItem = await db_1.prisma.carrito.create({
            data: {
                id_cliente: userId,
                // Asegúrate de que los campos coincidan con tu modelo CarritoItem
                items: {
                    create: [{
                            id_producto: productId,
                            cantidad: quantity,
                        }]
                }
            },
            include: { items: true }
        });
        res.status(201).json(cartItem);
    }
    catch (err) {
        res.status(500).json({ message: 'Error al agregar al carrito' });
    }
}
