"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepository = void 0;
// src/repositories/ProductRepository.ts
const db_1 = require("../config/db");
class ProductRepository {
    // Devuelve todos los productos
    async findAll() {
        return await db_1.prisma.producto.findMany();
    }
    // Busca un producto por su ID
    async findById(id) {
        return await db_1.prisma.producto.findUnique({ where: { id } });
    }
    // Crea un nuevo producto
    async create(data) {
        return await db_1.prisma.producto.create({ data });
    }
    // Actualiza un producto existente
    async update(id, data) {
        return await db_1.prisma.producto.update({ where: { id }, data });
    }
    // Elimina un producto
    async delete(id) {
        return await db_1.prisma.producto.delete({ where: { id } });
    }
}
exports.ProductRepository = ProductRepository;
