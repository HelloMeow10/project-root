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
  async loginCliente(email: string, contrasena: string) {
    const user = await prisma.cliente.findUnique({ where: { email } });
    if (!user) throw new Error('Usuario no encontrado');
    const isMatch = await bcrypt.compare(contrasena, user.contrasena);
    if (!isMatch) throw new Error('Credenciales inválidas');
    const token = jwt.sign(
      { userId: user.id_cliente, tipo: 'cliente' },
      process.env.JWT_SECRET as string,
      { expiresIn: '2h' }
    );
    return token;
  }
}
