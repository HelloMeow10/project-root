"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
// src/repositories/OrderRepository.ts
const db_1 = require("../config/db");
class OrderRepository {
    async findAll() {
        return await db_1.prisma.pedido.findMany();
    }
    async findById(id) {
        return await db_1.prisma.pedido.findUnique({ where: { id } });
    }
    async create(data) {
        // Calcular total o agregar lógica adicional si es necesario
        return await db_1.prisma.pedido.create({ data });
    }
}
exports.OrderRepository = OrderRepository;
