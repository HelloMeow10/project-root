import { prisma } from '../config/db';

export class UserRepository {
  // Para usuarios internos (empleados/admins)
  async findAllInternos() {
    return prisma.usuarioInterno.findMany({
      select: { id_usuario: true, nombre: true, email: true, activo: true, rol: { select: { nombre: true } } }
    });
  }

  // Para clientes
  async findAllClientes() {
    return prisma.cliente.findMany({
      select: { id_cliente: true, nombre: true, email: true, activo: true }
    });
  }
}