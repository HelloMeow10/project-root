// src/config/db.ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

// Función para inicializar la conexión (opcional para migraciones, etc.)
export async function initDatabase() {
  await prisma.$connect();
  console.log('Conectado a la base de datos PostgreSQL');
}
