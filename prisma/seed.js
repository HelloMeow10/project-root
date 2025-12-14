// Generated seed runner translating TypeScript seed.ts to JS for production container
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const prisma = new PrismaClient();

async function runNecesidadSQL() {
  const filePath = path.join(__dirname, '..', 'necesidad.txt');
  if (!fs.existsSync(filePath)) {
    console.log('necesidad.txt not found, skipping raw SQL import');
    return;
  }
  const sql = fs.readFileSync(filePath, 'utf-8');
  if (!sql.trim()) {
    console.log('necesidad.txt is empty, skipping');
    return;
  }
  const dbUrl = process.env.DATABASE_URL;
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('necesidad.txt executed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error executing necesidad.txt:', err.message);
  } finally {
    await client.end();
  }
}

async function ensureAdmin() {
  const adminEmail = 'admin@musimundo.com';
  const adminPassword = 'admin123';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  // Upsert ADMIN role (model Rol with fields id_rol, nombre, descripcion)
  const adminRole = await prisma.rol.upsert({
    where: { nombre: 'ADMIN' },
    update: {},
    create: { nombre: 'ADMIN', descripcion: 'Administrador del sistema' },
  });

  // Create or update UsuarioInterno with ADMIN role
  const existing = await prisma.usuarioInterno.findUnique({ where: { email: adminEmail } });
  if (existing) {
    await prisma.usuarioInterno.update({
      where: { email: adminEmail },
      data: { contrasena: passwordHash, id_rol: adminRole.id_rol },
    });
    console.log('Updated existing admin user');
  } else {
    await prisma.usuarioInterno.create({
      data: {
        nombre: 'Admin',
        apellido: 'Musimundo',
        email: adminEmail,
        contrasena: passwordHash,
        telefono: null,
        activo: true,
        id_rol: adminRole.id_rol,
      },
    });
    console.log('Created admin user');
  }
}

async function main() {
  try {
    await runNecesidadSQL();
    await ensureAdmin();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
