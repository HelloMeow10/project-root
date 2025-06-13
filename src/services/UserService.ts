import { UserRepository } from '../repositories/UserRepository';

export class UserService {
  private repo = new UserRepository();

  async obtenerUsuariosInternos() {
    const usuarios = await this.repo.findAllInternos();
    return usuarios.map((u: any) => ({
      id: u.id_usuario,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      telefono: u.telefono,
      activo: u.activo,
      id_rol: u.id_rol
    }));
  }

  async obtenerClientes() {
    const clientes = await this.repo.findAllClientes();
    return clientes.map((u: any) => ({
      id: u.id_cliente,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      telefono: u.telefono,
      activo: u.activo
    }));
  }
}