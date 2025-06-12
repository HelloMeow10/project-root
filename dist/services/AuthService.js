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
    async login(email, contrasena) {
        // 1. Buscar en Cliente
        const cliente = await db_1.prisma.cliente.findUnique({ where: { email } });
        if (cliente) {
            const isMatch = await bcryptjs_1.default.compare(contrasena, cliente.contrasena);
            if (!isMatch)
                throw new Error('Credenciales inválidas');
            const token = jsonwebtoken_1.default.sign({ userId: cliente.id_cliente, tipo: 'cliente', nombre: cliente.nombre }, process.env.JWT_SECRET, { expiresIn: '2h' });
            return { token, tipo: 'cliente' };
        }
        // 2. Buscar en UsuarioInterno
        const admin = await db_1.prisma.usuarioInterno.findUnique({ where: { email } });
        if (admin) {
            const isMatch = await bcryptjs_1.default.compare(contrasena, admin.contrasena);
            if (!isMatch)
                throw new Error('Credenciales inválidas');
            // Solo permite acceso si es ADMIN
            const rol = await db_1.prisma.rol.findUnique({ where: { id_rol: admin.id_rol } });
            if (!rol || rol.nombre !== 'ADMIN')
                throw new Error('Acceso denegado');
            const token = jsonwebtoken_1.default.sign({ userId: admin.id_usuario, tipo: 'admin', nombre: admin.nombre }, process.env.JWT_SECRET, { expiresIn: '2h' });
            return { token, tipo: 'admin' };
        }
        throw new Error('Usuario no encontrado');
    }
}
exports.AuthService = AuthService;
