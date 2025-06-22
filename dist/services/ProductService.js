"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
// src/services/ProductService.ts
const db_1 = require("../config/db");
const ProductRepository_1 = require("../repositories/ProductRepository");
/**
 * Mapea un objeto de producto de Prisma (con posibles relaciones) a un objeto Producto más plano,
 * incluyendo una lista de sus componentes si es un paquete.
 * @function mapPrismaProductoToProducto
 * @param {any} prismaProducto - El objeto producto obtenido de Prisma, potencialmente con `paqueteDetallesAsPaquete` y `tipoProducto`.
 * @returns {Producto & { componentes?: ProductoComponente[] }} Un objeto Producto extendido con una lista opcional de componentes.
 */
function mapPrismaProductoToProducto(prismaProducto) {
    var _a;
    let componentes = [];
    if (prismaProducto.paqueteDetallesAsPaquete && prismaProducto.paqueteDetallesAsPaquete.length > 0) {
        componentes = prismaProducto.paqueteDetallesAsPaquete.map((detalle) => ({
            id_producto: detalle.producto.id_producto,
            nombre: detalle.producto.nombre,
            // tipo: detalle.producto.tipoProducto?.nombre // Uncomment if type was selected in repo
        }));
    }
    return {
        id_producto: prismaProducto.id_producto,
        nombre: prismaProducto.nombre,
        tipo: (_a = prismaProducto.tipoProducto) === null || _a === void 0 ? void 0 : _a.nombre, // Deriva el nombre del tipo si está incluido
        descripcion: prismaProducto.descripcion,
        precio: prismaProducto.precio,
        stock: prismaProducto.stock,
        activo: prismaProducto.activo,
        id_tipo: prismaProducto.id_tipo,
        componentes: componentes.length > 0 ? componentes : undefined // Add componentes, omit if empty
    };
}
/**
 * @class ProductService
 * @description Proporciona métodos para la gestión de productos, incluyendo la lógica de negocio para productos simples y paquetes.
 */
class ProductService {
    constructor() {
        this.repo = new ProductRepository_1.ProductRepository();
    }
    /**
     * Obtiene todos los productos que no son de tipo 'paquete'.
     * Estos se consideran productos individuales que pueden ser vendidos solos o como parte de un paquete.
     * @async
     * @method obtenerProductosIndividuales
     * @returns {Promise<Producto[]>} Una lista de productos individuales.
     * @throws {Error} Si el TipoProducto 'paquete' no se encuentra (aunque actualmente retorna array vacío).
     */
    async obtenerProductosIndividuales() {
        const tipoPaquete = await db_1.prisma.tipoProducto.findUnique({
            where: { nombre: 'paquete' },
            select: { id_tipo: true }
        });
        if (!tipoPaquete) {
            console.error("TipoProducto 'paquete' not found. Cannot filter for individual products.");
            return []; // Or throw an error, depending on desired strictness
        }
        const productosIndividuales = await this.repo.findAllWhereNotTipo(tipoPaquete.id_tipo);
        return productosIndividuales.map(mapPrismaProductoToProducto);
    }
    /**
     * Obtiene todos los productos disponibles en el sistema.
     * @async
     * @method obtenerProductos
     * @returns {Promise<Producto[]>} Una lista de todos los productos.
     */
    async obtenerProductos() {
        const productos = await this.repo.findAll();
        return productos.map(mapPrismaProductoToProducto);
    }
    /**
     * Obtiene un producto específico por su ID.
     * Incluye detalles como tipo de producto y componentes si es un paquete.
     * @async
     * @method obtenerProductoPorId
     * @param {number} id - El ID del producto a obtener.
     * @returns {Promise<Producto & { componentes?: ProductoComponente[] }>} El producto encontrado.
     * @throws {Error} Si el producto no se encuentra.
     */
    async obtenerProductoPorId(id) {
        console.log('PRODUCTSERVICE: obtenerProductoPorId called with ID:', id);
        const producto = await this.repo.findById(id); // findById ya hace los includes profundos
        if (!producto)
            throw new Error('Producto no encontrado');
        const productoMapeado = mapPrismaProductoToProducto(producto);
        // Si es un pasaje y tiene configuración de avión, la añadimos al resultado mapeado
        if (producto.pasaje && producto.pasaje.avionConfig) {
            productoMapeado.avionConfig = {
                id_avion_config: producto.pasaje.avionConfig.id_avion_config,
                nombre_config: producto.pasaje.avionConfig.nombre_config,
                total_filas: producto.pasaje.avionConfig.total_filas,
                columnas_config: producto.pasaje.avionConfig.columnas_config,
                asientos: producto.pasaje.avionConfig.asientos.map((asiento) => ({
                    id_asiento: asiento.id_asiento,
                    fila: asiento.fila,
                    columna: asiento.columna,
                    caracteristicas: asiento.caracteristicas,
                    precio_adicional_base: asiento.precio_adicional_base,
                    id_tipo_asiento_base: asiento.id_tipo_asiento_base,
                    tipoAsientoBase: {
                        id_tipo_asiento: asiento.tipoAsientoBase.id_tipo_asiento,
                        nombre: asiento.tipoAsientoBase.nombre,
                        descripcion: asiento.tipoAsientoBase.descripcion
                    }
                })),
            };
        }
        return productoMapeado;
    }
    /**
     * Crea un nuevo producto completo, incluyendo datos específicos de su tipo (ej. Hospedaje, Pasaje)
     * si se proporcionan y el tipo de producto corresponde.
     * @async
     * @method crearProductoCompleto
     * @param {any} data - Datos del producto a crear. Debe incluir `nombre`, `precio`, `nombre_tipo_producto`.
     *                     Puede incluir opcionalmente `descripcion`, `stock`, `activo`, y objetos como
     *                     `hospedaje`, `pasaje`, `alquiler`, `auto` con sus respectivos campos.
     * @returns {Promise<Producto & { componentes?: ProductoComponente[] }>}
     *          El producto recién creado.
     * @throws {Error} Si faltan datos requeridos, el tipo de producto no existe, el precio es negativo, o hay un error en la transacción.
     */
    async crearProductoCompleto(data) {
        if (data.precio < 0)
            throw new Error('El precio debe ser positivo');
        if (!data.nombre_tipo_producto)
            throw new Error('El campo nombre_tipo_producto (string) es requerido');
        const tipoProductoRecord = await db_1.prisma.tipoProducto.findUnique({
            where: { nombre: data.nombre_tipo_producto.toLowerCase() }, // Normalizar a minúsculas
        });
        if (!tipoProductoRecord) {
            throw new Error(`Tipo de producto '${data.nombre_tipo_producto}' no encontrado.`);
        }
        const id_tipo_resolved = tipoProductoRecord.id_tipo;
        // Datos base para el producto
        const productoData = {
            nombre: data.nombre,
            descripcion: data.descripcion,
            precio: parseFloat(data.precio),
            stock: data.stock !== undefined ? parseInt(data.stock, 10) : null,
            activo: data.activo !== undefined ? data.activo : true,
            id_tipo: id_tipo_resolved,
            // codigo_producto: data.codigo_producto, // Si se añade este campo al schema
        };
        // Asegurarse de que stock es un entero si se provee
        if (data.stock !== undefined && isNaN(productoData.stock)) {
            throw new Error('El stock debe ser un número.');
        }
        return db_1.prisma.$transaction(async (tx) => {
            const nuevoProducto = await tx.producto.create({
                data: productoData,
                include: { tipoProducto: true }
            });
            // Crear datos específicos del tipo
            switch (tipoProductoRecord.nombre) {
                case 'hospedaje':
                    if (!data.hospedaje)
                        throw new Error("Datos de hospedaje requeridos.");
                    await tx.hospedaje.create({
                        data: {
                            id_producto: nuevoProducto.id_producto,
                            ubicacion: data.hospedaje.ubicacion,
                            fecha_inicio: data.hospedaje.fecha_inicio ? new Date(data.hospedaje.fecha_inicio) : null,
                            fecha_fin: data.hospedaje.fecha_fin ? new Date(data.hospedaje.fecha_fin) : null,
                            capacidad: data.hospedaje.capacidad ? parseInt(data.hospedaje.capacidad, 10) : null,
                        }
                    });
                    break;
                case 'pasaje':
                    if (!data.pasaje)
                        throw new Error("Datos de pasaje requeridos.");
                    await tx.pasaje.create({
                        data: {
                            id_producto: nuevoProducto.id_producto,
                            origen: data.pasaje.origen,
                            destino: data.pasaje.destino,
                            fecha_salida: data.pasaje.fecha_salida ? new Date(data.pasaje.fecha_salida) : null,
                            fecha_regreso: data.pasaje.fecha_regreso ? new Date(data.pasaje.fecha_regreso) : null,
                            asientos_disponibles: data.pasaje.asientos_disponibles ? parseInt(data.pasaje.asientos_disponibles, 10) : null,
                            aerolinea: data.pasaje.aerolinea
                            // id_tipo_asiento removed
                        }
                    });
                    break;
                case 'alquiler': // Asumiendo que 'alquiler' es el nombre en TipoProducto para Alquiler de Auto/Vehículo
                    if (!data.alquiler)
                        throw new Error("Datos de alquiler requeridos.");
                    await tx.alquiler.create({
                        data: {
                            id_producto: nuevoProducto.id_producto,
                            tipo_vehiculo: data.alquiler.tipo_vehiculo,
                            ubicacion: data.alquiler.ubicacion,
                            fecha_inicio: data.alquiler.fecha_inicio ? new Date(data.alquiler.fecha_inicio) : null,
                            fecha_fin: data.alquiler.fecha_fin ? new Date(data.alquiler.fecha_fin) : null,
                            cantidad: data.alquiler.cantidad !== undefined ? parseInt(data.alquiler.cantidad, 10) : 0,
                        }
                    });
                    // Si 'cantidad' en Alquiler afecta el 'stock' principal de Producto, ajustar lógica.
                    // Por ahora, se asume que Producto.stock es para la disponibilidad general del "servicio de alquiler"
                    // y Alquiler.cantidad es cuántos vehículos específicos de ese tipo hay.
                    break;
                case 'auto': // Este es un modelo separado, si 'alquiler' no lo cubre.
                    // O si 'auto' es un TipoProducto que usa el modelo 'Auto'.
                    if (!data.auto)
                        throw new Error("Datos de auto requeridos.");
                    await tx.auto.create({
                        data: {
                            id_producto: nuevoProducto.id_producto,
                            modelo: data.auto.modelo,
                            marca: data.auto.marca,
                            capacidad: data.auto.capacidad ? parseInt(data.auto.capacidad, 10) : null,
                            ubicacion_actual: data.auto.ubicacion_actual,
                            estado: data.auto.estado, // ej. "disponible", "en_mantenimiento"
                        }
                    });
                    break;
                // No se necesita caso para 'paquete' aquí, ya que los componentes se añaden por separado.
            }
            // Volver a buscar el producto con todos sus detalles para la respuesta
            const productoCompleto = await tx.producto.findUnique({
                where: { id_producto: nuevoProducto.id_producto },
                include: {
                    tipoProducto: true,
                    hospedaje: true,
                    pasaje: true, // Removed tipoAsiento from include
                    alquiler: true,
                    Auto: true,
                    // No incluimos paquetes aquí para evitar circularidad en la creación inicial
                }
            });
            if (!productoCompleto)
                throw new Error("Error al recuperar el producto completo creado."); // No debería pasar
            return mapPrismaProductoToProducto(productoCompleto); // Usar el mapper
        });
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
    /**
     * Elimina un producto por su ID.
     * @async
     * @method deleteProduct
     * @param {number} id - El ID del producto a eliminar.
     * @returns {Promise<any>} El resultado de la operación de borrado del repositorio.
     * @throws {Error} Si el producto no se encuentra, o si está referenciado y no puede ser eliminado.
     */
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
    /**
     * Agrega un producto componente a un paquete existente.
     * Valida que el paquete base sea de tipo 'paquete' y que el componente no sea un paquete.
     * No permite añadir un paquete a sí mismo o duplicar componentes (por ahora lanza error si ya existe).
     * @async
     * @method agregarComponenteAPaqueteServ
     * @param {number} id_paquete - El ID del producto que es el paquete base.
     * @param {number} id_producto_componente - El ID del producto a agregar como componente.
     * @param {number} cantidad - La cantidad del producto componente a agregar.
     * @returns {Promise<Producto & { componentes?: ProductoComponente[] }>} El paquete actualizado con el nuevo componente.
     * @throws {Error} Si las validaciones fallan (ej. IDs inválidos, tipo incorrecto, componente ya existe).
     */
    async agregarComponenteAPaqueteServ(id_paquete, id_producto_componente, cantidad) {
        var _a;
        // Fetch the package product to ensure it exists and is a package
        const paqueteProducto = await this.repo.findById(id_paquete); // Renamed 'paquete' to 'paqueteProducto' for clarity with logs
        console.log(`[Svc AddComp Detail] Start validation for id_paquete ${id_paquete}.`);
        if (!paqueteProducto) {
            console.error(`[Svc AddComp Detail] VALIDATION FAIL: paqueteProducto (id: ${id_paquete}) NOT FOUND.`);
            throw new Error('Paquete base no encontrado o el ID proporcionado no corresponde a un paquete.');
        }
        console.log(`[Svc AddComp Detail] paqueteProducto IS found. Name: ${paqueteProducto.nombre}`);
        if (!paqueteProducto.tipoProducto) {
            console.error(`[Svc AddComp Detail] VALIDATION FAIL: paqueteProducto.tipoProducto IS UNDEFINED/NULL for id_paquete ${id_paquete}. Full object:`, JSON.stringify(paqueteProducto, null, 2));
            throw new Error('Paquete base no encontrado o el ID proporcionado no corresponde a un paquete.');
        }
        console.log(`[Svc AddComp Detail] paqueteProducto.tipoProducto IS found. Name: ${paqueteProducto.tipoProducto.nombre}`);
        // Solo una declaración de isCorrectType
        const isCorrectType = paqueteProducto.tipoProducto.nombre === 'paquete';
        console.log(`[Svc AddComp Detail] Is correct type ('paqueteProducto.tipoProducto.nombre === "paquete"'): ${isCorrectType}`);
        if (!isCorrectType) {
            console.error(`[Svc AddComp Detail] VALIDATION FAIL: Type is NOT 'paquete'. Actual type: '${paqueteProducto.tipoProducto.nombre}'.`);
            throw new Error('Paquete base no encontrado o el ID proporcionado no corresponde a un paquete.');
        }
        console.log(`[Svc AddComp Detail] All validations passed for id_paquete ${id_paquete}.`);
        // Elimina el bloque duplicado a continuación:
        /*
        if (!paqueteProducto.tipoProducto) {
            console.error(`[Svc AddComp Detail] VALIDATION FAIL: paqueteProducto.tipoProducto IS UNDEFINED/NULL for id_paquete ${id_paquete}. Full object:`, JSON.stringify(paqueteProducto, null, 2));
            throw new Error('Paquete base no encontrado o el ID proporcionado no corresponde a un paquete.');
        }
        console.log(`[Svc AddComp Detail] paqueteProducto.tipoProducto IS found. Name: ${paqueteProducto.tipoProducto.nombre}`);
    
        // Solo una declaración de isCorrectType
        const isCorrectType = paqueteProducto.tipoProducto.nombre === 'paquete';
        console.log(`[Svc AddComp Detail] Is correct type ('paqueteProducto.tipoProducto.nombre === "paquete"'): ${isCorrectType}`);
    
        if (!isCorrectType) {
            console.error(`[Svc AddComp Detail] VALIDATION FAIL: Type is NOT 'paquete'. Actual type: '${paqueteProducto.tipoProducto.nombre}'.`);
            throw new Error('Paquete base no encontrado o el ID proporcionado no corresponde a un paquete.');
        }
    
        console.log(`[Svc AddComp Detail] All validations passed for id_paquete ${id_paquete}.`);
        */
        // Fetch the component product to ensure it exists and is NOT a package
        const componente = await this.repo.findById(id_producto_componente);
        if (!componente) {
            throw new Error("Producto componente no encontrado.");
        }
        if (((_a = componente.tipo) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'paquete') {
            throw new Error("No se puede agregar un paquete como componente de otro paquete.");
        }
        if (id_paquete === id_producto_componente) {
            throw new Error("Un paquete no puede ser componente de sí mismo.");
        }
        // Check if the component already exists in the package
        const existingDetail = await db_1.prisma.paqueteDetalle.findFirst({
            where: {
                id_paquete: id_paquete,
                id_producto: id_producto_componente,
            },
        });
        if (existingDetail) {
            // For now, throw an error. Future enhancement could update quantity.
            throw new Error("Este componente ya existe en el paquete. Modifique su cantidad si es necesario o elimínelo primero.");
        }
        // Create the PaqueteDetalle record
        await db_1.prisma.paqueteDetalle.create({
            data: {
                id_paquete: id_paquete,
                id_producto: id_producto_componente,
                cantidad: cantidad,
            },
        });
        // Fetch and return the updated package product with all its details
        return this.obtenerProductoPorId(id_paquete);
    }
    /**
     * Elimina un producto componente de un paquete específico.
     * @async
     * @method eliminarComponenteDePaqueteServ
     * @param {number} id_paquete - El ID del paquete del cual se eliminará el componente.
     * @param {number} id_producto_componente - El ID del producto componente a eliminar.
     * @returns {Promise<Producto & { componentes?: ProductoComponente[] }>} El paquete actualizado tras la eliminación del componente.
     * @throws {Error} Si el paquete base no se encuentra o si el componente no existe en el paquete.
     */
    async eliminarComponenteDePaqueteServ(id_paquete, id_producto_componente) {
        // Fetch the package product to ensure it exists
        const paquete = await this.repo.findById(id_paquete);
        if (!paquete) { // It implicitly also checks if it's a package via its components later
            throw new Error("Paquete base no encontrado.");
        }
        const deleteResult = await db_1.prisma.paqueteDetalle.deleteMany({
            where: {
                id_paquete: id_paquete,
                id_producto: id_producto_componente,
            },
        });
        if (deleteResult.count === 0) {
            throw new Error("Componente no encontrado en este paquete o ya fue eliminado.");
        }
        // Fetch and return the updated package product with all its details
        return this.obtenerProductoPorId(id_paquete);
    }
    /**
     * Obtiene la configuración de un avión para un pasaje específico, incluyendo el estado de ocupación de cada asiento.
     * @async
     * @method obtenerConfiguracionAvionConAsientosOcupados
     * @param {number} idProductoPasaje - El ID del Producto que representa el Pasaje (vuelo).
     * @returns {Promise<any | null>} Objeto con la configuración del avión y la lista de asientos con su estado, o null si no se encuentra.
     * @throws {Error} Si el producto no es un pasaje o no tiene configuración de avión.
     */
    async obtenerConfiguracionAvionConAsientosOcupados(idProductoPasaje) {
        const productoPasaje = await db_1.prisma.producto.findUnique({
            where: { id_producto: idProductoPasaje },
            include: {
                tipoProducto: true,
                pasaje: {
                    include: {
                        avionConfig: {
                            include: {
                                asientos: {
                                    orderBy: [{ fila: 'asc' }, { columna: 'asc' }],
                                    include: {
                                        tipoAsientoBase: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!productoPasaje || !productoPasaje.pasaje || !productoPasaje.pasaje.avionConfig) {
            console.warn(`Pasaje con ID de producto ${idProductoPasaje} no encontrado o sin configuración de avión.`);
            throw new Error('Pasaje no encontrado o sin configuración de avión asignada.');
        }
        const { avionConfig } = productoPasaje.pasaje;
        if (!avionConfig || !avionConfig.asientos) {
            throw new Error('Configuración de avión o asientos no disponibles para este pasaje.');
        }
        // Obtener todos los PedidoItem asociados a este Producto (Pasaje)
        const pedidosItemsParaEsteVuelo = await db_1.prisma.pedidoItem.findMany({
            where: { id_producto: idProductoPasaje },
            select: { id_detalle: true },
        });
        const idsPedidoItemParaEsteVuelo = pedidosItemsParaEsteVuelo.map(pi => pi.id_detalle);
        let asientosOcupadosIds = new Set();
        if (idsPedidoItemParaEsteVuelo.length > 0) {
            const seleccionesAsientosParaEsteVuelo = await db_1.prisma.seleccionAsientoPasajero.findMany({
                where: {
                    id_pedido_item: { in: idsPedidoItemParaEsteVuelo },
                },
                select: { id_asiento_fisico: true },
            });
            asientosOcupadosIds = new Set(seleccionesAsientosParaEsteVuelo.map(s => s.id_asiento_fisico));
        }
        const asientosConEstado = avionConfig.asientos.map((asiento) => ({
            id_asiento: asiento.id_asiento,
            fila: asiento.fila,
            columna: asiento.columna,
            caracteristicas: asiento.caracteristicas,
            precio_adicional_base: asiento.precio_adicional_base,
            id_tipo_asiento_base: asiento.id_tipo_asiento_base,
            tipoAsientoBase: asiento.tipoAsientoBase ? {
                id_tipo_asiento: asiento.tipoAsientoBase.id_tipo_asiento,
                nombre: asiento.tipoAsientoBase.nombre,
                descripcion: asiento.tipoAsientoBase.descripcion,
                multiplicador_precio: asiento.tipoAsientoBase.multiplicador_precio,
            } : null,
            ocupado: asientosOcupadosIds.has(asiento.id_asiento),
        }));
        return {
            id_avion_config: avionConfig.id_avion_config,
            nombre_config: avionConfig.nombre_config,
            total_filas: avionConfig.total_filas,
            columnas_config: avionConfig.columnas_config,
            asientos: asientosConEstado,
        };
    }
    /**
     * Obtiene todas las opciones de equipaje activas.
     * @async
     * @method obtenerOpcionesEquipajeActivas
     * @returns {Promise<OpcionEquipaje[]>} Una lista de opciones de equipaje activas.
     */
    async obtenerOpcionesEquipajeActivas() {
        return db_1.prisma.opcionEquipaje.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' },
        });
    }
    /**
     * Obtiene todos los Tipos de Asiento que pueden ser seleccionados como clase de servicio.
     * Incluye el nombre y el multiplicador de precio.
     * @async
     * @method obtenerClasesDeServicioDisponibles
     * @returns {Promise<Array<{id_tipo_asiento: number, nombre: string, multiplicador_precio: number | null}>>} Lista de clases de servicio.
     */
    async obtenerClasesDeServicioDisponibles() {
        return db_1.prisma.tipoAsiento.findMany({
            select: {
                id_tipo_asiento: true,
                nombre: true,
                descripcion: true,
                multiplicador_precio: true,
            },
            orderBy: {
                multiplicador_precio: 'asc',
            },
        });
    }
}
exports.ProductService = ProductService;
