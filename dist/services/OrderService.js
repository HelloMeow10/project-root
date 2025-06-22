"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const db_1 = require("../config/db"); // Usaremos prisma client directamente para transacciones
const OrderRepository_1 = require("../repositories/OrderRepository"); // Aún podemos usarlo para otras ops si es necesario
/**
 * @class OrderService
 * @description Proporciona métodos para la gestión de pedidos.
 */
class OrderService {
    /**
     * Crea una instancia de OrderService.
     */
    constructor() {
        this.orderRepository = new OrderRepository_1.OrderRepository(); // Puede ser útil para get/update/delete
    }
    /**
     * Obtiene una lista de pedidos, con opciones de filtrado y ordenación.
     * @async
     * @method obtenerPedidos
     * @param {object} [filtros] - Opciones de filtrado.
     * @param {string} [filtros.estado] - Filtrar por estado del pedido.
     * @param {number} [filtros.id_cliente] - Filtrar por ID de cliente.
     * @param {object} [orden] - Opciones de ordenación.
     * @param {string} [orden.campo] - Campo por el cual ordenar.
     * @param {'asc' | 'desc'} [orden.direccion] - Dirección de la ordenación.
     * @returns {Promise<Array<object>>} Una lista de pedidos con sus detalles.
     */
    async obtenerPedidos(filtros, orden) {
        const whereClause = {};
        if (filtros === null || filtros === void 0 ? void 0 : filtros.estado) {
            whereClause.estado = filtros.estado;
        }
        if (filtros === null || filtros === void 0 ? void 0 : filtros.id_cliente) {
            whereClause.id_cliente = filtros.id_cliente;
        }
        const orderByClause = {};
        if ((orden === null || orden === void 0 ? void 0 : orden.campo) && (orden === null || orden === void 0 ? void 0 : orden.direccion)) {
            if (orden.campo === 'cliente') {
                // Ordenar por nombre de cliente requiere un join o una forma diferente si se hace directo en Prisma
                // Por ahora, si es por cliente, podríamos ordenar por id_cliente o nombre si el cliente está en el include
                // Esto es más complejo y podría requerir post-procesamiento o una query más específica.
                // Simplificación: ordenar por fecha_pedido si el campo es 'cliente' para evitar complejidad ahora.
                orderByClause['cliente'] = { nombre: orden.direccion }; // Asume que se puede ordenar por campo de relación
            }
            else {
                orderByClause[orden.campo] = orden.direccion;
            }
        }
        else {
            orderByClause['fecha_pedido'] = 'desc'; // Orden por defecto
        }
        return db_1.prisma.pedido.findMany({
            where: whereClause,
            include: {
                cliente: true, // Necesario para ordenar por nombre de cliente o mostrar info
                items: { include: { producto: true } },
                pagos: true
            },
            orderBy: orderByClause,
        });
    }
    /**
     * Obtiene todos los pedidos de un cliente específico.
     * @async
     * @method obtenerPedidosPorCliente
     * @param {number} idCliente - El ID del cliente.
     * @returns {Promise<Array<object>>} Una lista de pedidos del cliente.
     */
    async obtenerPedidosPorCliente(idCliente) {
        return db_1.prisma.pedido.findMany({
            where: { id_cliente: idCliente },
            include: { items: { include: { producto: true } }, pagos: true },
            orderBy: { fecha_pedido: 'desc' }
        });
    }
    /**
     * Obtiene un pedido específico por su ID.
     * @async
     * @method obtenerPedidoPorId
     * @param {number} id - El ID del pedido.
     * @returns {Promise<object | null>} El objeto del pedido con sus detalles, o null si no se encuentra.
     */
    async obtenerPedidoPorId(id) {
        return db_1.prisma.pedido.findUnique({
            where: { id_pedido: id },
            include: { cliente: true, items: { include: { producto: true } }, pagos: true },
        });
    }
    /**
     * Crea un nuevo pedido a partir del carrito de un cliente.
     * Realiza validaciones de stock y disponibilidad de productos.
     * Calcula precios basados en clase de servicio, asiento seleccionado y equipaje adicional para vuelos.
     * Actualiza el stock de los productos y vacía el carrito del usuario dentro de una transacción.
     * @async
     * @method crearPedidoDesdeCarrito
     * @param {number} idCliente - El ID del cliente para el cual crear el pedido.
     * @param {any[]} itemsConDetallesAdicionales - Array de items del carrito, donde cada item puede tener
     *                                              `seleccion_clase_servicio_id`, `seleccion_asiento_fisico_id`,
     *                                              y `selecciones_equipaje` si es un vuelo.
     * @param {number} [idDireccionFacturacion] - El ID opcional de la dirección de facturación.
     * @returns {Promise<object>} El nuevo pedido creado con sus detalles.
     * @throws {Error} Si el carrito está vacío, un producto no está disponible/activo, o no hay stock suficiente, o datos adicionales son inválidos.
     */
    async crearPedidoDesdeCarrito(idCliente, itemsConDetallesAdicionales, idDireccionFacturacion) {
        var _a, _b;
        // Primero, obtenemos el carrito real de la BD para asegurar la integridad de los datos base (producto, cantidad base)
        const carritoBD = await db_1.prisma.carrito.findFirst({
            where: { id_cliente: idCliente },
            include: {
                items: {
                    include: {
                        producto: { include: { tipoProducto: true, pasaje: { include: { avionConfig: true } } } },
                    },
                },
            },
        });
        if (!carritoBD || carritoBD.items.length === 0) {
            throw new Error('El carrito está vacío.');
        }
        // Mapear los items del carrito de la BD para fácil acceso por id_producto
        const carritoBDItemsMap = new Map(carritoBD.items.map(item => [item.id_producto, item]));
        const itemsParaPedidoCreate = [];
        let granTotalPedido = 0;
        const seleccionesAsientoParaItem = [];
        const seleccionesEquipajeParaItem = [];
        // Iterar sobre los items enviados desde el frontend (que pueden tener detalles adicionales)
        for (const itemFrontend of itemsConDetallesAdicionales) {
            const itemBD = carritoBDItemsMap.get(itemFrontend.id_producto);
            if (!itemBD || !itemBD.producto) {
                throw new Error(`Producto con ID ${itemFrontend.id_producto} no encontrado en el carrito del usuario o producto no existe.`);
            }
            if (!itemBD.producto.activo) {
                throw new Error(`El producto "${itemBD.producto.nombre}" ya no está disponible.`);
            }
            if (itemBD.producto.stock !== null && itemFrontend.cantidad > itemBD.producto.stock) {
                throw new Error(`Stock insuficiente para "${itemBD.producto.nombre}". Solicitado: ${itemFrontend.cantidad}, Disponible: ${itemBD.producto.stock}`);
            }
            let precioUnitarioBase = itemBD.producto.precio;
            let precioTotalItemCalculado = 0;
            let idClaseServicioSeleccionadaParaItem = undefined;
            let asientoSeleccionadoData = null;
            let equipajeSeleccionadoData = [];
            // ---- Lógica específica para productos de tipo 'vuelo' ----
            if (((_a = itemBD.producto.tipoProducto) === null || _a === void 0 ? void 0 : _a.nombre.toLowerCase()) === 'vuelo') {
                let precioAjustadoPorClase = precioUnitarioBase;
                // 1. Aplicar Clase de Servicio seleccionada
                if (itemFrontend.seleccion_clase_servicio_id) {
                    const claseServicio = await db_1.prisma.tipoAsiento.findUnique({
                        where: { id_tipo_asiento: Number(itemFrontend.seleccion_clase_servicio_id) },
                    });
                    if (!claseServicio || !claseServicio.multiplicador_precio) {
                        throw new Error(`Clase de servicio con ID ${itemFrontend.seleccion_clase_servicio_id} no válida o sin multiplicador.`);
                    }
                    precioAjustadoPorClase = Number(precioUnitarioBase) * Number(claseServicio.multiplicador_precio);
                    idClaseServicioSeleccionadaParaItem = claseServicio.id_tipo_asiento;
                }
                precioTotalItemCalculado += precioAjustadoPorClase * itemFrontend.cantidad;
                // 2. Procesar Asiento Seleccionado (si existe)
                if (itemFrontend.seleccion_asiento_fisico_id) {
                    if (!((_b = itemBD.producto.pasaje) === null || _b === void 0 ? void 0 : _b.avionConfig)) {
                        throw new Error(`El vuelo ${itemBD.producto.nombre} no tiene una configuración de avión para seleccionar asientos.`);
                    }
                    const asientoSeleccionado = await db_1.prisma.asiento.findUnique({
                        where: { id_asiento: Number(itemFrontend.seleccion_asiento_fisico_id) },
                    });
                    if (!asientoSeleccionado || asientoSeleccionado.id_avion_config !== itemBD.producto.pasaje.avionConfig.id_avion_config) {
                        throw new Error(`Asiento con ID ${itemFrontend.seleccion_asiento_fisico_id} no válido para este vuelo.`);
                    }
                    const precioAdicionalAsiento = Number(asientoSeleccionado.precio_adicional_base) || 0;
                    precioTotalItemCalculado += precioAdicionalAsiento * itemFrontend.cantidad;
                    asientoSeleccionadoData = {
                        id_asiento_fisico: asientoSeleccionado.id_asiento,
                        precio_seleccion_asiento: precioAdicionalAsiento,
                    };
                }
                // 3. Procesar Equipaje Adicional
                if (itemFrontend.selecciones_equipaje && Array.isArray(itemFrontend.selecciones_equipaje)) {
                    for (const equipaje of itemFrontend.selecciones_equipaje) {
                        const opcionEquipaje = await db_1.prisma.opcionEquipaje.findUnique({
                            where: { id_opcion_equipaje: Number(equipaje.id_opcion_equipaje) },
                        });
                        if (!opcionEquipaje || !opcionEquipaje.activo) {
                            throw new Error(`Opción de equipaje ID ${equipaje.id_opcion_equipaje} no válida o inactiva.`);
                        }
                        const cantidadEquipaje = Number(equipaje.cantidad) || 1;
                        const precioTotalOpcionEquipaje = Number(opcionEquipaje.precio_adicional) * cantidadEquipaje;
                        precioTotalItemCalculado += precioTotalOpcionEquipaje;
                        equipajeSeleccionadoData.push({
                            id_opcion_equipaje: opcionEquipaje.id_opcion_equipaje,
                            cantidad: cantidadEquipaje,
                            precio_seleccion_equipaje: precioTotalOpcionEquipaje,
                        });
                    }
                }
            }
            else {
                // Para productos que no son vuelos, el precio total es simplemente precio base * cantidad
                precioTotalItemCalculado = Number(precioUnitarioBase) * itemFrontend.cantidad;
            }
            itemsParaPedidoCreate.push({
                id_producto: itemBD.id_producto,
                cantidad: itemFrontend.cantidad,
                precio_unitario_base: precioUnitarioBase,
                precio_total_item: precioTotalItemCalculado,
                id_clase_servicio_seleccionada: idClaseServicioSeleccionadaParaItem,
            });
            seleccionesAsientoParaItem.push(asientoSeleccionadoData);
            seleccionesEquipajeParaItem.push(equipajeSeleccionadoData);
            granTotalPedido += precioTotalItemCalculado;
        }
        return db_1.prisma.$transaction(async (tx) => {
            const nuevoPedido = await tx.pedido.create({
                data: {
                    id_cliente: idCliente,
                    total: granTotalPedido,
                    estado: 'PENDIENTE_PAGO',
                    id_direccion_facturacion: idDireccionFacturacion,
                    items: {
                        create: itemsParaPedidoCreate.map(item => ({
                            id_producto: item.id_producto,
                            cantidad: item.cantidad,
                            precio_unitario_base: item.precio_unitario_base,
                            precio_total_item: item.precio_total_item,
                            id_clase_servicio_seleccionada: item.id_clase_servicio_seleccionada,
                        })),
                    },
                },
                include: {
                    items: true,
                    cliente: true,
                }
            });
            // Ahora, con los PedidoItems creados y sus IDs (id_detalle), creamos las selecciones de asiento y equipaje
            for (let i = 0; i < itemsConDetallesAdicionales.length; i++) {
                const itemFrontend = itemsConDetallesAdicionales[i];
                const pedidoItemCreado = nuevoPedido.items.find(pi => pi.id_producto === itemFrontend.id_producto && pi.cantidad === itemFrontend.cantidad);
                // Crear SeleccionAsientoPasajero si aplica
                if (pedidoItemCreado && seleccionesAsientoParaItem[i]) {
                    // Validación de ocupación de asiento (simplificada)
                    if (itemFrontend.seleccion_asiento_fisico_id) {
                        const pasajeDelItem = await tx.pasaje.findUnique({ where: { id_producto: pedidoItemCreado.id_producto } });
                        if (pasajeDelItem && pasajeDelItem.id_avion_config) {
                            const otrosItemsDeEsteVueloConMismoAsiento = await tx.seleccionAsientoPasajero.count({
                                where: {
                                    id_asiento_fisico: Number(itemFrontend.seleccion_asiento_fisico_id),
                                    pedidoItem: {
                                        producto: { pasaje: { id_avion_config: pasajeDelItem.id_avion_config } },
                                    }
                                }
                            });
                            if (otrosItemsDeEsteVueloConMismoAsiento > 0) {
                                throw new Error(`El asiento ${itemFrontend.seleccion_asiento_fisico_id} ya no está disponible para el vuelo ${itemFrontend.id_producto}.`);
                            }
                        }
                        await tx.seleccionAsientoPasajero.create({
                            data: {
                                id_pedido_item: pedidoItemCreado.id_detalle,
                                id_asiento_fisico: Number(itemFrontend.seleccion_asiento_fisico_id),
                                precio_seleccion_asiento: seleccionesAsientoParaItem[i].precio_seleccion_asiento,
                            },
                        });
                    }
                }
                // Crear SeleccionEquipajePasajero si aplica
                if (pedidoItemCreado && seleccionesEquipajeParaItem[i] && seleccionesEquipajeParaItem[i].length > 0) {
                    for (const equipajeData of seleccionesEquipajeParaItem[i]) {
                        await tx.seleccionEquipajePasajero.create({
                            data: {
                                id_pedido_item: pedidoItemCreado.id_detalle,
                                id_opcion_equipaje: equipajeData.id_opcion_equipaje,
                                cantidad: equipajeData.cantidad,
                                precio_seleccion_equipaje: equipajeData.precio_seleccion_equipaje,
                            },
                        });
                    }
                }
            }
            // Actualizar el stock de los productos base (como antes)
            for (const item of carritoBD.items) {
                if (item.producto.stock !== null) {
                    await tx.producto.update({
                        where: { id_producto: item.id_producto },
                        data: { stock: { decrement: item.cantidad } },
                    });
                }
            }
            await tx.carritoItem.deleteMany({
                where: { id_carrito: carritoBD.id_carrito },
            });
            // Devolver el pedido con todos sus detalles, incluyendo las nuevas selecciones anidadas
            return tx.pedido.findUnique({
                where: { id_pedido: nuevoPedido.id_pedido },
                include: {
                    cliente: true,
                    direccionFacturacion: true,
                    items: {
                        include: {
                            producto: { include: { tipoProducto: true } },
                            claseServicioSeleccionada: true,
                            seleccion_asiento: { include: { asientoFisico: { include: { tipoAsientoBase: true } } } },
                            selecciones_equipaje: { include: { opcionEquipaje: true } }
                        }
                    },
                    pagos: true
                }
            });
        });
    }
    // El crearPedido original que usa el repositorio puede mantenerse si hay otros usos,
    // o marcarse como obsoleto/privado si crearPedidoDesdeCarrito es el principal.
    /**
     * Crea un pedido con datos proporcionados (método de bajo nivel, generalmente no usado directamente por controladores).
     * @async
     * @method crearPedidoConData
     * @param {any} data - Datos para la creación del pedido.
     * @returns {Promise<object>} El pedido creado.
     * @deprecated Usar `crearPedidoDesdeCarrito` para la lógica de negocio estándar.
     */
    async crearPedidoConData(data) {
        return this.orderRepository.create(data);
    }
    /**
     * Actualiza un pedido existente.
     * Incluye lógica para reponer stock si un pedido es cancelado.
     * @async
     * @method actualizarPedido
     * @param {number} id - El ID del pedido a actualizar.
     * @param {any} data - Los datos a actualizar en el pedido (ej. `{ estado: 'CANCELADO' }`).
     * @returns {Promise<object>} El pedido actualizado.
     * @throws {Error} Si el pedido no se encuentra.
     */
    async actualizarPedido(id, data) {
        // Aquí se podría añadir lógica de negocio, como no permitir cambiar ciertos campos
        // una vez que el pedido está en cierto estado, etc.
        const pedidoActual = await db_1.prisma.pedido.findUnique({
            where: { id_pedido: id },
            include: { items: true }
        });
        if (!pedidoActual) {
            throw new Error('Pedido no encontrado para actualizar.');
        }
        // Lógica de reposición de stock si se cancela un pedido
        if (data.estado === 'CANCELADO' && pedidoActual.estado !== 'CANCELADO') {
            return db_1.prisma.$transaction(async (tx) => {
                for (const item of pedidoActual.items) {
                    if (item.id_producto) { // Asegurarse de que el item tiene un producto asociado
                        const producto = await tx.producto.findUnique({ where: { id_producto: item.id_producto } });
                        if (producto && producto.stock !== null) { // Solo reponer si el stock no es ilimitado
                            await tx.producto.update({
                                where: { id_producto: item.id_producto },
                                data: { stock: { increment: item.cantidad } },
                            });
                        }
                    }
                }
                return tx.pedido.update({
                    where: { id_pedido: id },
                    data, // data aquí debería ser solo { estado: 'CANCELADO' } si es cancelación
                    include: { items: true, cliente: true, pagos: true },
                });
            });
        }
        // Actualización normal para otros campos o por admin
        return db_1.prisma.pedido.update({
            where: { id_pedido: id },
            data,
            include: { items: true, cliente: true, pagos: true },
        });
    }
    /**
     * Elimina un pedido de la base de datos.
     * Nota: Generalmente, los pedidos se marcan como 'CANCELADO' en lugar de eliminarse físicamente.
     * La reposición de stock no se maneja aquí; debe ser gestionada al cambiar el estado a 'CANCELADO'.
     * @async
     * @method eliminarPedido
     * @param {number} id - El ID del pedido a eliminar.
     * @returns {Promise<object>} El resultado de la operación de eliminación.
     */
    async eliminarPedido(id) {
        // Considerar lógica de negocio: ¿Se pueden eliminar pedidos en cualquier estado?
        // ¿O solo se marcan como cancelados?
        // Por ahora, eliminación física, PERO NO SE REPONE STOCK AQUÍ.
        // La reposición de stock debería manejarse si se cambia el estado a CANCELADO.
        // Si se elimina directamente, es una decisión administrativa que podría no implicar reposición.
        return db_1.prisma.pedido.delete({ where: { id_pedido: id } });
    }
}
exports.OrderService = OrderService;
