"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
// src/services/ProductService.ts
const ProductRepository_1 = require("../repositories/ProductRepository");
function mapPrismaProductoToProducto(prismaProducto) {
    return {
        id: prismaProducto.id_producto,
        nombre: prismaProducto.nombre,
        descripcion: prismaProducto.descripcion,
        precio: prismaProducto.precio,
        stock: prismaProducto.stock,
        // agrega otros campos si tu interfaz los tiene
    };
}
class ProductService {
    constructor() {
        this.repo = new ProductRepository_1.ProductRepository();
    }
    // Obtiene todos los productos disponibles
    async obtenerProductos() {
        const productos = await this.repo.findAll();
        return productos.map(mapPrismaProductoToProducto);
    }
    // Obtiene un producto por ID, lanza error si no existe
    async obtenerProductoPorId(id) {
        const producto = await this.repo.findById(id);
        if (!producto)
            throw new Error('Producto no encontrado');
        return mapPrismaProductoToProducto(producto);
    }
    // Crea un producto, validando datos (ejemplo simple)
    async crearProducto(data) {
        if (data.precio < 0)
            throw new Error('El precio debe ser positivo');
        // Prisma espera id_tipo, debes adaptar si es necesario
        const prismaData = Object.assign(Object.assign({}, data), { id_tipo: 1 }); // Ajusta id_tipo según corresponda
        const producto = await this.repo.create(prismaData);
        return mapPrismaProductoToProducto(producto);
    }
    // Actualiza un producto existente
    async actualizarProducto(id, data) {
        const producto = await this.repo.update(id, data);
        return mapPrismaProductoToProducto(producto);
    }
    // Elimina un producto
    async eliminarProducto(id) {
        const producto = await this.repo.delete(id);
        return mapPrismaProductoToProducto(producto);
    }
}
exports.ProductService = ProductService;
