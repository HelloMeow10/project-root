// src/models/pedido.ts
export interface Pedido {
  id: number;
  fecha: Date;
  cantidad: number;
  total: number;
  productoId: number;
  usuarioId: number;
}
