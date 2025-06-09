"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.initDatabase = initDatabase;
// src/config/db.ts
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
// Función para inicializar la conexión (opcional para migraciones, etc.)
async function initDatabase() {
    await exports.prisma.$connect();
    console.log('Conectado a la base de datos PostgreSQL');
}
