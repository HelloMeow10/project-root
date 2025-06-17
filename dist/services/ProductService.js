"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
// src/services/ProductService.ts
const ProductRepository_1 = require("../repositories/ProductRepository");
function mapPrismaProductoToProducto(prismaProducto) {
    return {
        id: prismaProducto.id_producto,
        nombre: prismaProducto.nombre,
        tipo: prismaProducto.tipo, // <-- AGREGA ESTA LÍNEA
        descripcion: prismaProducto.descripcion,
        precio: prismaProducto.precio,
        stock: prismaProducto.stock,
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
        // Mapear tipo string a id_tipo
        let id_tipo = 1;
        if (data.tipo === 'vuelo')
            id_tipo = 2;
        else if (data.tipo === 'hotel')
            id_tipo = 3;
        else if (data.tipo === 'auto')
            id_tipo = 4;
        const prismaData = Object.assign(Object.assign({}, data), { id_tipo });
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
