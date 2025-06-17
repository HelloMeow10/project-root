"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const CartController_1 = require("../controllers/CartController");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authMiddleware, CartController_1.getCart); // GET /api/cart
router.post('/', authMiddleware_1.authMiddleware, CartController_1.addToCart); // POST /api/cart
router.delete('/', authMiddleware_1.authMiddleware, CartController_1.clearCart); // DELETE /api/cart
router.patch('/item/:id', authMiddleware_1.authMiddleware, CartController_1.updateCartItem); // PATCH /api/cart/item/:id
router.delete('/item/:id', authMiddleware_1.authMiddleware, CartController_1.removeCartItem); // DELETE /api/cart/item/:id
exports.default = router;
