"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const db_1 = require("../config/db"); // Usaremos prisma client directamente para transacciones
const OrderRepository_1 = require("../repositories/OrderRepository"); // Aún podemos usarlo para otras ops si es necesario
class OrderService {
    constructor() {
        this.orderRepository = new OrderRepository_1.OrderRepository(); // Puede ser útil para get/update/delete
    }
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
    async obtenerPedidosPorCliente(idCliente) {
        return db_1.prisma.pedido.findMany({
            where: { id_cliente: idCliente },
            include: { items: { include: { producto: true } }, pagos: true },
            orderBy: { fecha_pedido: 'desc' }
        });
    }
    async obtenerPedidoPorId(id) {
        return db_1.prisma.pedido.findUnique({
            where: { id_pedido: id },
            include: { cliente: true, items: { include: { producto: true } }, pagos: true },
        });
    }
    async crearPedidoDesdeCarrito(idCliente, idDireccionFacturacion) {
        const carrito = await db_1.prisma.carrito.findFirst({
            where: { id_cliente: idCliente },
            include: {
                items: {
                    include: {
                        producto: true, // Incluir detalles del producto para stock y precio
                    },
                },
            },
        });
        if (!carrito || carrito.items.length === 0) {
            throw new Error('El carrito está vacío.');
        }
        // Validaciones y preparación de datos de pedido
        const itemsPedidoData = [];
        let totalPedido = 0;
        for (const item of carrito.items) {
            if (!item.producto) {
                throw new Error(`Producto con ID ${item.id_producto} no encontrado en el carrito.`);
            }
            if (!item.producto.activo) {
                throw new Error(`El producto "${item.producto.nombre}" ya no está disponible.`);
            }
            if (item.producto.stock !== null && item.cantidad > item.producto.stock) {
                throw new Error(`Stock insuficiente para el producto "${item.producto.nombre}". Solicitado: ${item.cantidad}, Disponible: ${item.producto.stock}`);
            }
            itemsPedidoData.push({
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio: item.producto.precio, // Usar el precio actual del producto
            });
            totalPedido += item.producto.precio * item.cantidad;
        }
        // Usar transacción de Prisma
        return db_1.prisma.$transaction(async (tx) => {
            // 1. Crear el Pedido
            const nuevoPedido = await tx.pedido.create({
                data: {
                    id_cliente: idCliente,
                    total: totalPedido,
                    estado: 'PENDIENTE_PAGO', // Estado inicial del pedido
                    id_direccion_facturacion: idDireccionFacturacion,
                    items: {
                        create: itemsPedidoData,
                    },
                },
                include: {
                    items: { include: { producto: true } },
                    cliente: true,
                }
            });
            // 2. Actualizar el stock de los productos
            for (const item of carrito.items) {
                if (item.producto.stock !== null) { // Solo actualizar si el stock no es ilimitado
                    await tx.producto.update({
                        where: { id_producto: item.id_producto },
                        data: { stock: { decrement: item.cantidad } },
                    });
                }
            }
            // 3. Vaciar el carrito del usuario
            await tx.carritoItem.deleteMany({
                where: { id_carrito: carrito.id_carrito },
            });
            // Opcionalmente, eliminar el carrito si se desea que se cree uno nuevo la próxima vez.
            // await tx.carrito.delete({ where: { id_carrito: carrito.id_carrito } });
            return nuevoPedido;
        });
    }
    // El crearPedido original que usa el repositorio puede mantenerse si hay otros usos,
    // o marcarse como obsoleto/privado si crearPedidoDesdeCarrito es el principal.
    async crearPedidoConData(data) {
        return this.orderRepository.create(data);
    }
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
