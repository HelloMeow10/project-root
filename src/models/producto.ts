// src/models/producto.ts
export interface Producto {
  id_producto: number;
  nombre: string;
  tipo?: string;
  descripcion?: string;
  precio: number;
  stock?: number;
  activo: boolean;
  id_tipo?: number;
}
