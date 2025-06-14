"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ message: 'Token no proporcionado' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ message: 'Token inválido' });
    }
}
// Assuming you have an Express router instance
const express_1 = require("express");
const router = (0, express_1.Router)();
// Your clearCart controller logic here
function clearCart(req, res) {
    // Clear cart logic
    res.json({ message: 'Cart cleared' });
}
// Apply the authMiddleware to the delete route
router.delete('/', authMiddleware, clearCart);
exports.default = router;
