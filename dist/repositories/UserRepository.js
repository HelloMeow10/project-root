"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const db_1 = require("../config/db");
class UserRepository {
    // Para usuarios internos (empleados/admins)
    async findAllInternos() {
        return db_1.prisma.usuarioInterno.findMany({
            select: { id_usuario: true, nombre: true, email: true, activo: true, rol: { select: { nombre: true } } }
        });
    }
    // Para clientes
    async findAllClientes() {
        return db_1.prisma.cliente.findMany({
            select: { id_cliente: true, nombre: true, email: true, activo: true }
        });
    }
}
exports.UserRepository = UserRepository;
