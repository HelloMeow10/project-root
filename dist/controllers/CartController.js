"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToCart = addToCart;
async function addToCart(req, res) {
    const { productId, quantity } = req.body;
    const userId = req.user.id; // User info from JWT
    try {
        const cartItem = await prisma.cart.create({
            data: {
                userId,
                productId,
                quantity,
            },
        });
        res.status(201).json(cartItem);
    }
    catch (err) {
        res.status(500).json({ message: 'Error al agregar al carrito' });
    }
}
