// src/models/usuario.ts
export interface Usuario {
  id: number;
  email: string;
  password: string;
  nombre: string;
  rol: string;
}


export interface UsuarioPublico {
  id: number;
  email: string;
  nombre: string;
  rol: string;
}