import { prisma } from '../config/db';

export class UserRepository {
  async findAllInternos() {
    return prisma.usuarioInterno.findMany({
      select: {
        id_usuario: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        activo: true,
        id_rol: true
      }
    });
  }

  async findAllClientes() {
    return prisma.cliente.findMany({
      select: {
        id_cliente: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        activo: true
      }
    });
  }
}