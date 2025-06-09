// src/services/AuthService.ts
import { prisma } from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/usuario';

export class AuthService {
  // Registra un nuevo usuario (cliente o jefe de ventas)
  async register(userData: Omit<Usuario, 'id' | 'rol'>): Promise<Usuario> {
    const hashed = await bcrypt.hash(userData.password, 10);
    const newUser = await prisma.usuario.create({ 
      data: { ...userData, password: hashed, rol: 'CLIENTE' } 
    });
    return newUser;
  }

  // Inicia sesión: verifica credenciales y genera JWT
  async login(email: string, password: string): Promise<string> {
    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) throw new Error('Usuario no encontrado');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Credenciales inválidas');
    // Generar token JWT firmada con el ID y rol del usuario
    const token = jwt.sign(
      { userId: user.id, rol: user.rol },
      process.env.JWT_SECRET as string,
      { expiresIn: '2h' }
    );
    return token;
  }
}
