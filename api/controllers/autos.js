// Obtener autos disponibles desde la base de datos con Prisma

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function obtenerAutosDisponibles() {
  // Buscar el tipo de producto "Auto" (ajusta el nombre si es diferente)
  const tipoAuto = await prisma.tipoProducto.findFirst({
    where: { nombre: { contains: 'auto', mode: 'insensitive' } }
  });
  if (!tipoAuto) return [];

  // Buscar productos de tipo "Auto" activos y con stock
  const autos = await prisma.producto.findMany({
    where: {
      id_tipo: tipoAuto.id_tipo,
      activo: true,
      stock: { gt: 0 }
    },
    include: {
      alquiler: true
    }
  });

  return autos;
}

// Ejemplo de uso:
obtenerAutosDisponibles()
  .then(autos => {
    console.log('Autos disponibles:', autos);
  })
  .catch(err => {
    console.error('Error al obtener autos:', err);
  });

module.exports = { obtenerAutosDisponibles };