"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log('Auth Middleware - Authorization Header:', authHeader ? 'Present' : 'Missing'); // Debug
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No token provided or invalid format');
        res.status(401).json({ message: 'Token no proporcionado o formato inválido' });
        return;
    }
    const token = authHeader.split(' ')[1];
    console.log('Auth Middleware - Token:', token ? 'Present' : 'Missing'); // Debug
    if (!token) {
        console.log('Token missing after split');
        res.status(401).json({ message: 'Token no proporcionado' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log('Auth Middleware - Decoded JWT Payload:', decoded); // Debug
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Auth Middleware - Invalid token:', error);
        res.status(401).json({ message: 'Token inválido' });
    }
}
