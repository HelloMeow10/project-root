"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepository = void 0;
// src/repositories/ProductRepository.ts
const db_1 = require("../config/db");
class ProductRepository {
    // Devuelve todos los productos, incluyendo el tipo
    async findAll() {
        return await db_1.prisma.producto.findMany({
            include: { tipoProducto: true }
        });
    }
    async findAllWhereNotTipo(id_tipo_excluir) {
        return await db_1.prisma.producto.findMany({
            where: {
                NOT: {
                    id_tipo: id_tipo_excluir
                },
                activo: true // Optionally, only list active individual products for selection
            },
            include: { tipoProducto: true },
            orderBy: { nombre: 'asc' }
        });
    }
    // Busca un producto por su ID, incluyendo el tipo y, si es pasaje, toda la estructura de avión y asientos
    async findById(id_producto) {
        if (!id_producto || isNaN(Number(id_producto)))
            return null;
        return await db_1.prisma.producto.findUnique({
            where: { id_producto },
            include: {
                tipoProducto: true,
                paqueteDetallesAsPaquete: {
                    orderBy: { producto: { nombre: 'asc' } },
                    include: {
                        producto: {
                            include: {
                                tipoProducto: true // Ahora también incluye el tipo del componente
                            }
                        }
                    }
                },
                pasaje: {
                    include: {
                        avionConfig: {
                            include: {
                                asientos: {
                                    include: {
                                        tipoAsientoBase: true
                                    }
                                }
                            }
                        }
                    }
                },
                hospedaje: true,
                alquiler: true,
                Auto: true
            }
        });
    }
    // Crea un nuevo producto
    async create(data) {
        return await db_1.prisma.producto.create({ data, include: { tipoProducto: true } });
    }
    // Actualiza un producto existente
    async update(id_producto, data) {
        return await db_1.prisma.producto.update({ where: { id_producto }, data, include: { tipoProducto: true } });
    }
    // Elimina un producto
    async delete(id_producto) {
        return await db_1.prisma.producto.delete({ where: { id_producto } });
    }
}
exports.ProductRepository = ProductRepository;
