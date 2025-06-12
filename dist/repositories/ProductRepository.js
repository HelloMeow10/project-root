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
    async findById(id_producto) {
        return await db_1.prisma.producto.findUnique({ where: { id_producto } });
    }
    // Crea un nuevo producto
    async create(data) {
        return await db_1.prisma.producto.create({ data });
    }
    // Actualiza un producto existente
    async update(id_producto, data) {
        return await db_1.prisma.producto.update({ where: { id_producto }, data });
    }
    // Elimina un producto
    async delete(id_producto) {
        return await db_1.prisma.producto.delete({ where: { id_producto } });
    }
}
exports.ProductRepository = ProductRepository;
