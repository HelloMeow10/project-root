import { OrderRepository } from '../repositories/OrderRepository';

export class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  async obtenerPedidos() {
    return this.orderRepository.getAll();
  }

  async obtenerPedidoPorId(id: number) {
    return this.orderRepository.getById(id);
  }

  async crearPedido(data: any) {
    return this.orderRepository.create(data);
  }

  async actualizarPedido(id: number, data: any) {
    return this.orderRepository.update(id, data);
  }

  async eliminarPedido(id: number) {
    return this.orderRepository.delete(id);
  }
}