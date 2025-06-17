// src/models/usuario.ts
export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido?: string;
  email: string;
  contrasena: string;
  telefono?: string;
  direccion?: string;
  fecha_registro: Date;
  activo: boolean;
  email_verificado: boolean;
  token_verificacion_email?: string;
}

export interface ClientePublico {
  id_cliente: number;
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fecha_registro: Date;
  activo: boolean;
  email_verificado: boolean;
}