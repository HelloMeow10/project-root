import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  // Ejecutar migraciones por si acaso
  // Nota: en Docker se ejecutará via npm run migrate:deploy

  // Sembrar usando el SQL del archivo necesidad.txt
  const seedPath = path.resolve(__dirname, '..', 'necesidad.txt');
  const sql = fs.readFileSync(seedPath, 'utf-8');

  const pgClient = new Client({ connectionString: process.env.DATABASE_URL });
  await pgClient.connect();
  try {
    await pgClient.query('BEGIN');
    await pgClient.query(sql);
    await pgClient.query('COMMIT');
    console.log('Seed SQL ejecutado correctamente.');
  } catch (e) {
    await pgClient.query('ROLLBACK');
    console.error('Error ejecutando seed SQL:', e);
    throw e;
  } finally {
    await pgClient.end();
  }

  // Crear admin adicional solicitado si no existe
  const adminRole = await prisma.rol.upsert({
    where: { nombre: 'ADMIN' },
    update: {},
    create: { nombre: 'ADMIN', descripcion: 'Administrador del sistema' },
  });

  const bcrypt = await import('bcryptjs');
  const passwordHash = bcrypt.hashSync('admin123', 10);

  await prisma.usuarioInterno.upsert({
    where: { email: 'admin@musimundo.com' },
    update: {},
    create: {
      nombre: 'Admin',
      apellido: 'Musimundo',
      email: 'admin@musimundo.com',
      contrasena: passwordHash,
      telefono: '1111111111',
      activo: true,
      id_rol: adminRole.id_rol,
    },
  });

  console.log('Usuario admin@musimundo.com creado/asegurado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
