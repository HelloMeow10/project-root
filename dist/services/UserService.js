"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const UserRepository_1 = require("../repositories/UserRepository");
class UserService {
    constructor() {
        this.repo = new UserRepository_1.UserRepository();
    }
    async obtenerUsuariosInternos() {
        const usuarios = await this.repo.findAllInternos();
        return usuarios.map((u) => ({
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
        return clientes.map((u) => ({
            id: u.id_cliente,
            nombre: u.nombre,
            apellido: u.apellido,
            email: u.email,
            telefono: u.telefono,
            activo: u.activo
        }));
    }
}
exports.UserService = UserService;
