"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
// src/services/ProductService.ts
const ProductRepository_1 = require("../repositories/ProductRepository");
function mapPrismaProductoToProducto(prismaProducto) {
    var _a;
    return {
        id_producto: prismaProducto.id_producto,
        nombre: prismaProducto.nombre,
        tipo: (_a = prismaProducto.tipoProducto) === null || _a === void 0 ? void 0 : _a.nombre, // Deriva el nombre del tipo si está incluido
        descripcion: prismaProducto.descripcion,
        precio: prismaProducto.precio,
        stock: prismaProducto.stock,
        activo: prismaProducto.activo,
        id_tipo: prismaProducto.id_tipo
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
        if (!data.id_tipo)
            throw new Error('id_tipo es requerido');
        // No se debe mapear tipo string a id_tipo aquí, debe venir del frontend o lógica superior
        const prismaData = Object.assign({}, data);
        const producto = await this.repo.create(prismaData);
        return mapPrismaProductoToProducto(producto);
    }
    // Elimina un producto
    async deleteProduct(id) {
        return this.repo.delete(id);
    }
}
exports.ProductService = ProductService;
