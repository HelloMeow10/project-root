"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const OrderRepository_1 = require("../repositories/OrderRepository");
class OrderService {
    constructor() {
        this.orderRepository = new OrderRepository_1.OrderRepository();
    }
    async obtenerPedidos() {
        return this.orderRepository.getAll();
    }
    async obtenerPedidoPorId(id) {
        return this.orderRepository.getById(id);
    }
    async crearPedido(data) {
        return this.orderRepository.create(data);
    }
    async actualizarPedido(id, data) {
        return this.orderRepository.update(id, data);
    }
    async eliminarPedido(id) {
        return this.orderRepository.delete(id);
    }
}
exports.OrderService = OrderService;
