// src/services/AuthService.ts
import { prisma } from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
  // Registro de cliente
  async registerCliente(userData: { nombre: string; apellido?: string; email: string; contrasena: string; telefono?: string; direccion?: string; }) {
    const hashed = await bcrypt.hash(userData.contrasena, 10);
    const newUser = await prisma.cliente.create({
      data: { ...userData, contrasena: hashed }
    });
    return newUser;
  }

  // Login de cliente
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
