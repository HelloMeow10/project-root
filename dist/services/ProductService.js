"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
// src/services/ProductService.ts
const ProductRepository_1 = require("../repositories/ProductRepository");
class ProductService {
    constructor() {
        this.repo = new ProductRepository_1.ProductRepository();
    }
    // Obtiene todos los productos disponibles
    async obtenerProductos() {
        return await this.repo.findAll();
    }
    // Obtiene un producto por ID, lanza error si no existe
    async obtenerProductoPorId(id) {
        const producto = await this.repo.findById(id);
        if (!producto)
            throw new Error('Producto no encontrado');
        return producto;
    }
    // Crea un producto, validando datos (ejemplo simple)
    async crearProducto(data) {
        if (data.precio < 0)
            throw new Error('El precio debe ser positivo');
        return await this.repo.create(data);
    }
    // Actualiza un producto existente
    async actualizarProducto(id, data) {
        return await this.repo.update(id, data);
    }
    // Elimina un producto
    async eliminarProducto(id) {
        return await this.repo.delete(id);
    }
}
exports.ProductService = ProductService;
