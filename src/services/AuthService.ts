// src/services/AuthService.ts
import { prisma } from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * @class AuthService
 * @description Proporciona métodos para la autenticación y registro de usuarios.
 */
export class AuthService {
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
  async registerCliente(userData: { nombre: string; apellido?: string; email: string; contrasena: string; telefono?: string; direccion?: string; dni?: string; }) {
    const hashed = await bcrypt.hash(userData.contrasena, 10);
    // Generar token de verificación de email
    const token_verificacion_email = crypto.randomBytes(32).toString('hex');
    const newUser = await prisma.cliente.create({
      data: {
        ...userData,
        contrasena: hashed,
        email_verificado: false,
        token_verificacion_email
      }
    });
    return { ...newUser, token_verificacion_email };
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
  async login(email: string, contrasena: string) {
    // 1. Buscar en Cliente
    const cliente = await prisma.cliente.findUnique({ where: { email } });
    if (cliente) {
      const isMatch = await bcrypt.compare(contrasena, cliente.contrasena);
      if (!isMatch) throw new Error('Credenciales inválidas');
      const token = jwt.sign(
        { userId: cliente.id_cliente, tipo: 'cliente', nombre: cliente.nombre },
        process.env.JWT_SECRET as string,
        { expiresIn: '2h' }
      );
      return { token, tipo: 'cliente' };
    }

    // 2. Buscar en UsuarioInterno
    const admin = await prisma.usuarioInterno.findUnique({ where: { email } });
    if (admin) {
      const isMatch = await bcrypt.compare(contrasena, admin.contrasena);
      if (!isMatch) throw new Error('Credenciales inválidas');
      // Solo permite acceso si es ADMIN
      const rol = await prisma.rol.findUnique({ where: { id_rol: admin.id_rol } });
      if (!rol || rol.nombre !== 'ADMIN') throw new Error('Acceso denegado');
      const token = jwt.sign(
        { userId: admin.id_usuario, tipo: 'admin', nombre: admin.nombre },
        process.env.JWT_SECRET as string,
        { expiresIn: '2h' }
      );
      return { token, tipo: 'admin' };
    }

    throw new Error('Usuario no encontrado');
  }
}
