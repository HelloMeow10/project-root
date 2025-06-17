"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = getAllOrders;
exports.getOrderById = getOrderById;
exports.createOrder = createOrder;
exports.updateOrder = updateOrder;
exports.deleteOrder = deleteOrder;
const OrderService_1 = require("../services/OrderService");
const orderService = new OrderService_1.OrderService();
async function getAllOrders(req, res, next) {
    try {
        const orders = await orderService.obtenerPedidos();
        res.status(200).json(orders);
    }
    catch (err) {
        next(err);
    }
}
async function getOrderById(req, res, next) {
    var _a, _b, _c;
    try {
        const id = Number(req.params.id);
        const order = await orderService.obtenerPedidoPorId(id);
        // Solo el dueño o admin puede ver el pedido
        if (!order)
            return res.status(404).json({ message: 'Pedido no encontrado' });
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.tipo) !== 'admin' && ((_b = order.cliente) === null || _b === void 0 ? void 0 : _b.id_cliente) !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c.userId)) {
            return res.status(403).json({ message: 'No autorizado' });
        }
        res.status(200).json(order);
    }
    catch (err) {
        next(err);
    }
}
async function createOrder(req, res, next) {
    try {
        const newOrder = await orderService.crearPedido(req.body);
        res.status(201).json(newOrder);
    }
    catch (err) {
        next(err);
    }
}
async function updateOrder(req, res, next) {
    var _a, _b, _c;
    try {
        const id = Number(req.params.id);
        const order = await orderService.obtenerPedidoPorId(id);
        if (!order)
            return res.status(404).json({ message: 'Pedido no encontrado' });
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.tipo) !== 'admin' && ((_b = order.cliente) === null || _b === void 0 ? void 0 : _b.id_cliente) !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c.userId)) {
            return res.status(403).json({ message: 'No autorizado' });
        }
        const updated = await orderService.actualizarPedido(id, req.body);
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
}
async function deleteOrder(req, res, next) {
    var _a, _b, _c;
    try {
        const id = Number(req.params.id);
        const order = await orderService.obtenerPedidoPorId(id);
        if (!order)
            return res.status(404).json({ message: 'Pedido no encontrado' });
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.tipo) !== 'admin' && ((_b = order.cliente) === null || _b === void 0 ? void 0 : _b.id_cliente) !== ((_c = req.user) === null || _c === void 0 ? void 0 : _c.userId)) {
            return res.status(403).json({ message: 'No autorizado' });
        }
        await orderService.eliminarPedido(id);
        res.json({ message: 'Pedido eliminado' });
    }
    catch (err) {
        next(err);
    }
}
