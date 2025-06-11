"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const UserRepository_1 = require("../repositories/UserRepository");
class UserService {
    constructor() {
        this.repo = new UserRepository_1.UserRepository();
    }
    async obtenerUsuarios() {
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
exports.UserService = UserService;
