// src/models/producto.ts
export interface Producto {
  id: number;
  nombre: string;
  tipo: string; // <-- agrega esto
  descripcion?: string;
  precio: number;
  stock?: number;
}
