"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const db_1 = require("../config/db");
class UserRepository {
    async findAllInternos() {
        return db_1.prisma.usuarioInterno.findMany({
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
        return db_1.prisma.cliente.findMany({
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
exports.UserRepository = UserRepository;
