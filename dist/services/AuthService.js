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
const crypto_1 = __importDefault(require("crypto"));
/**
 * @class AuthService
 * @description Proporciona métodos para la autenticación y registro de usuarios.
 */
class AuthService {
    /**
     * Registra un nuevo cliente.
     * Hashea la contraseña y genera un token de verificación de email.
     * @async
     * @method registerCliente
     * @param {object} userData - Datos del cliente a registrar.
     * @param {string} userData.nombre - Nombre del cliente.
     * @param {string} [userData.apellido] - Apellido del cliente.
     * @param {string} userData.email - Email del cliente, debe ser único.
     * @param {string} userData.contrasena - Contraseña del cliente (sin hashear).
     * @param {string} [userData.telefono] - Teléfono del cliente.
     * @param {string} [userData.direccion] - Dirección del cliente.
     * @param {string} [userData.dni] - DNI del cliente.
     * @returns {Promise<object>} El objeto del nuevo cliente creado, incluyendo el `token_verificacion_email`.
     * @throws {Error} Si ocurre un error durante la creación en la base de datos.
     */
    async registerCliente(userData) {
        const hashed = await bcryptjs_1.default.hash(userData.contrasena, 10);
        // Generar token de verificación de email
        const token_verificacion_email = crypto_1.default.randomBytes(32).toString('hex');
        const newUser = await db_1.prisma.cliente.create({
            data: Object.assign(Object.assign({}, userData), { contrasena: hashed, email_verificado: false, token_verificacion_email })
        });
        return Object.assign(Object.assign({}, newUser), { token_verificacion_email });
    }
    /**
     * Maneja el login para clientes y administradores.
     * Busca primero en la tabla de Clientes, luego en UsuarioInterno (solo si es ADMIN).
     * @async
     * @method login
     * @param {string} email - Email del usuario.
     * @param {string} contrasena - Contraseña del usuario (sin hashear).
     * @returns {Promise<{token: string, tipo: string}>} Un objeto con el token JWT y el tipo de usuario ('cliente' o 'admin').
     * @throws {Error} Si las credenciales son inválidas, el usuario no se encuentra, o el UsuarioInterno no es ADMIN.
     */
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
