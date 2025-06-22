"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = getAllOrders;
exports.getMyOrders = getMyOrders;
exports.getOrderById = getOrderById;
exports.createOrder = createOrder;
exports.updateOrder = updateOrder;
exports.deleteOrder = deleteOrder;
const OrderService_1 = require("../services/OrderService");
const db_1 = require("../config/db"); // Para validación de email
const orderService = new OrderService_1.OrderService();
async function getAllOrders(req, res, next) {
    var _a;
    try {
        // Solo admin debería ver todos los pedidos
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.tipo) !== 'admin') {
            return res.status(403).json({ message: 'No autorizado para ver todos los pedidos.' });
        }
        const { estado, id_cliente, ordenPor, direccionOrden } = req.query;
        const filtros = {};
        if (estado)
            filtros.estado = String(estado);
        if (id_cliente)
            filtros.id_cliente = Number(id_cliente);
        const orden = {};
        if (ordenPor)
            orden.campo = String(ordenPor);
        if (direccionOrden && (String(direccionOrden) === 'asc' || String(direccionOrden) === 'desc')) {
            orden.direccion = String(direccionOrden);
        }
        else if (ordenPor) {
            orden.direccion = 'asc'; // Dirección por defecto si solo se provee el campo
        }
        const orders = await orderService.obtenerPedidos(Object.keys(filtros).length > 0 ? filtros : undefined, orden.campo ? orden : undefined);
        res.status(200).json(orders);
    }
    catch (err) {
        next(err);
    }
}
async function getMyOrders(req, res, next) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'No autenticado.' });
        }
        const orders = await orderService.obtenerPedidosPorCliente(userId);
        res.status(200).json(orders);
    }
    catch (err) {
        next(err);
    }
}
async function getOrderById(req, res, next) {
    var _a, _b;
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID de pedido inválido.' });
        }
        const order = await orderService.obtenerPedidoPorId(id);
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        // Solo el dueño o admin puede ver el pedido
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.tipo) !== 'admin' && order.id_cliente !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.userId)) {
            return res.status(403).json({ message: 'No autorizado para ver este pedido.' });
        }
        res.status(200).json(order);
    }
    catch (err) {
        next(err);
    }
}
async function createOrder(req, res, next) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'No autenticado.' });
        }
        // Validar que el email esté verificado antes de crear un pedido
        const cliente = await db_1.prisma.cliente.findUnique({ where: { id_cliente: userId } });
        if (!(cliente === null || cliente === void 0 ? void 0 : cliente.email_verificado)) {
            return res.status(403).json({ message: 'Debes verificar tu email antes de crear un pedido.' });
        }
        const { id_direccion_facturacion } = req.body; // Opcional
        const newOrder = await orderService.crearPedidoDesdeCarrito(userId, id_direccion_facturacion ? Number(id_direccion_facturacion) : undefined);
        res.status(201).json(newOrder);
    }
    catch (err) {
        if (err.message.includes('carrito está vacío') || err.message.includes('Stock insuficiente') || err.message.includes('ya no está disponible')) {
            return res.status(400).json({ message: err.message });
        }
        next(err);
    }
}
async function updateOrder(req, res, next) {
    var _a, _b;
    // Principalmente para que un admin actualice el estado del pedido, por ejemplo.
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID de pedido inválido.' });
        }
        const order = await orderService.obtenerPedidoPorId(id); // Para verificar existencia
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        const { estado, id_direccion_facturacion } = req.body;
        const dataToUpdate = {};
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.tipo) === 'admin') {
            // Admin puede actualizar estado y dirección de facturación
            if (estado)
                dataToUpdate.estado = estado;
            if (id_direccion_facturacion)
                dataToUpdate.id_direccion_facturacion = Number(id_direccion_facturacion);
        }
        else if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.userId) === order.id_cliente) {
            // Cliente solo puede cancelar su propio pedido si está PENDIENTE_PAGO
            if (estado === 'CANCELADO') {
                if (order.estado === 'PENDIENTE_PAGO') {
                    dataToUpdate.estado = 'CANCELADO';
                }
                else {
                    return res.status(403).json({ message: 'Solo puedes cancelar pedidos pendientes de pago.' });
                }
            }
            else if (estado || id_direccion_facturacion) {
                // Cliente intenta modificar otros campos o a otros estados no permitidos
                return res.status(403).json({ message: 'No tienes permiso para realizar esta modificación.' });
            }
        }
        else {
            return res.status(403).json({ message: 'No autorizado para actualizar este pedido.' });
        }
        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ message: "No se proporcionaron datos válidos o permitidos para actualizar." });
        }
        const updated = await orderService.actualizarPedido(id, dataToUpdate);
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
}
async function deleteOrder(req, res, next) {
    var _a;
    // Usualmente los pedidos no se eliminan físicamente, se marcan como cancelados.
    // Pero siguiendo la estructura actual:
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID de pedido inválido.' });
        }
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.tipo) !== 'admin') {
            return res.status(403).json({ message: 'No autorizado para eliminar este pedido.' });
        }
        const order = await orderService.obtenerPedidoPorId(id);
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        // Lógica adicional: ¿Se debe reponer el stock si se elimina un pedido?
        // Por ahora, no se implementa la reposición de stock al eliminar.
        await orderService.eliminarPedido(id);
        res.json({ message: 'Pedido eliminado.' }); // O cambiar a estado 'CANCELADO'
    }
    catch (err) {
        next(err);
    }
}
