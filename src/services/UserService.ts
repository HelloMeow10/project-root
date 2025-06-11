import { UserRepository } from '../repositories/UserRepository';
import { UsuarioPublico } from '../models/usuario';

export class UserService {
  private repo = new UserRepository();

  async obtenerUsuarios(): Promise<UsuarioPublico[]> {
    const usuarios = await this.repo.findAllInternos();
    return usuarios.map(u => ({
      id: u.id_usuario,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol.nombre,
      activo: u.activo
    }));
  }
}