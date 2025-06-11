"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// src/services/AuthService.ts
const db_1 = require("../config/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    // Registro de cliente
    async registerCliente(userData) {
        const hashed = await bcryptjs_1.default.hash(userData.contrasena, 10);
        const newUser = await db_1.prisma.cliente.create({
            data: Object.assign(Object.assign({}, userData), { contrasena: hashed })
        });
        return newUser;
    }
    // Login de cliente
    async loginCliente(email, contrasena) {
        const user = await db_1.prisma.cliente.findUnique({ where: { email } });
        if (!user)
            throw new Error('Usuario no encontrado');
        const isMatch = await bcryptjs_1.default.compare(contrasena, user.contrasena);
        if (!isMatch)
            throw new Error('Credenciales inválidas');
        const token = jsonwebtoken_1.default.sign({ userId: user.id_cliente, tipo: 'cliente' }, process.env.JWT_SECRET, { expiresIn: '2h' });
        return token;
    }
}
exports.AuthService = AuthService;
