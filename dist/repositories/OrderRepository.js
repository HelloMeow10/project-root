"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
// src/repositories/OrderRepository.ts
const db_1 = require("../config/db");
class OrderRepository {
    async getAll() {
        return db_1.prisma.pedido.findMany({
            include: {
                cliente: true,
                items: true,
                pagos: true
            }
        });
    }
    async getById(id_pedido) {
        return db_1.prisma.pedido.findUnique({
            where: { id_pedido },
            include: {
                cliente: true,
                items: true,
                pagos: true
            }
        });
    }
    async create(data) {
        return db_1.prisma.pedido.create({ data });
    }
    async update(id_pedido, data) {
        return db_1.prisma.pedido.update({ where: { id_pedido }, data });
    }
    async delete(id_pedido) {
        return db_1.prisma.pedido.delete({ where: { id_pedido } });
    }
}
exports.OrderRepository = OrderRepository;
