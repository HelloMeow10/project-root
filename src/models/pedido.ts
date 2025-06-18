// src/models/pedido.ts
export interface Pedido {
  id_pedido: number;
  total: number;
  estado: string;
  fecha_pedido: Date;
  id_cliente: number;
}

export interface PedidoItem {
  id_detalle: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio: number;
}
