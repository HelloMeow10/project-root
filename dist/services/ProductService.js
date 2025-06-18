"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
// src/services/ProductService.ts
const db_1 = require("../config/db");
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
        if (!data.tipo)
            throw new Error('El campo tipo (string del nombre del tipo) es requerido');
        const tipoProductoRecord = await db_1.prisma.tipoProducto.findUnique({
            where: { nombre: data.tipo },
        });
        if (!tipoProductoRecord) {
            throw new Error(`Tipo de producto '${data.tipo}' no encontrado.`);
        }
        const id_tipo_resolved = tipoProductoRecord.id_tipo;
        const prismaData = {
            nombre: data.nombre,
            descripcion: data.descripcion,
            precio: data.precio,
            stock: data.stock,
            activo: data.activo !== undefined ? data.activo : true,
            id_tipo: id_tipo_resolved,
        };
        const producto = await this.repo.create(prismaData);
        return mapPrismaProductoToProducto(producto);
    }
    async actualizarProducto(id, data) {
        const existingProduct = await this.repo.findById(id);
        if (!existingProduct) {
            throw new Error('Producto no encontrado');
        }
        const prismaUpdateData = {};
        if (data.nombre !== undefined)
            prismaUpdateData.nombre = data.nombre;
        if (data.descripcion !== undefined)
            prismaUpdateData.descripcion = data.descripcion;
        if (data.precio !== undefined) {
            if (data.precio < 0)
                throw new Error('El precio debe ser positivo');
            prismaUpdateData.precio = data.precio;
        }
        if (data.stock !== undefined)
            prismaUpdateData.stock = data.stock;
        if (data.activo !== undefined)
            prismaUpdateData.activo = data.activo;
        if (data.tipo) {
            const tipoProductoRecord = await db_1.prisma.tipoProducto.findUnique({
                where: { nombre: data.tipo },
            });
            if (!tipoProductoRecord) {
                throw new Error(`Tipo de producto '${data.tipo}' no encontrado.`);
            }
            prismaUpdateData.id_tipo = tipoProductoRecord.id_tipo;
        }
        // Optional: Could add a check here if Object.keys(prismaUpdateData).length === 0
        // to avoid an unnecessary update call if only data.tipo was provided and it resolved to the same id_tipo.
        // For now, allowing the update call regardless.
        const productoActualizado = await this.repo.update(id, prismaUpdateData);
        return mapPrismaProductoToProducto(productoActualizado);
    }
    // Elimina un producto
    async deleteProduct(id) {
        // Optional: First check if product exists
        const productExists = await this.repo.findById(id);
        if (!productExists) {
            throw new Error('Producto no encontrado'); // This error can be caught by controller
        }
        try {
            return await this.repo.delete(id);
        }
        catch (err) { // Use 'any' or Prisma.PrismaClientKnownRequestError
            if (err.code === 'P2003') { // Foreign key constraint violation
                console.error(`Attempted to delete product ${id} which has foreign key constraints.`, err);
                throw new Error('Este producto está referenciado y no puede ser eliminado.');
            }
            // P2025 is "Record to delete not found." - handled by check above, but good as fallback.
            if (err.code === 'P2025') {
                console.error(`Attempted to delete non-existent product ${id}.`, err);
                throw new Error('Producto no encontrado para eliminar.');
            }
            console.error(`Error deleting product ${id} in ProductService:`, err);
            throw err; // Re-throw other errors
        }
    }
}
exports.ProductService = ProductService;
