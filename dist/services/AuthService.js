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
    // Registra un nuevo usuario (cliente o jefe de ventas)
    async register(userData) {
        const hashed = await bcryptjs_1.default.hash(userData.password, 10);
        const newUser = await db_1.prisma.usuario.create({
            data: Object.assign(Object.assign({}, userData), { password: hashed, rol: 'CLIENTE' })
        });
        return newUser;
    }
    // Inicia sesión: verifica credenciales y genera JWT
    async login(email, password) {
        const user = await db_1.prisma.usuario.findUnique({ where: { email } });
        if (!user)
            throw new Error('Usuario no encontrado');
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch)
            throw new Error('Credenciales inválidas');
        // Generar token JWT firmada con el ID y rol del usuario
        const token = jsonwebtoken_1.default.sign({ userId: user.id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '2h' });
        return token;
    }
}
exports.AuthService = AuthService;
