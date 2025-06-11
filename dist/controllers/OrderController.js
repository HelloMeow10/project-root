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
    try {
        const id = Number(req.params.id);
        const order = await orderService.obtenerPedidoPorId(id);
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
    try {
        const id = Number(req.params.id);
        const updated = await orderService.actualizarPedido(id, req.body);
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
}
async function deleteOrder(req, res, next) {
    try {
        const id = Number(req.params.id);
        await orderService.eliminarPedido(id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
}
