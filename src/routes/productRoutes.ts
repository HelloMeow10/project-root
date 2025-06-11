// src/routes/productRoutes.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Endpoint para obtener todos los paquetes turísticos
router.get('/paquetes', async (req, res) => {
  try {
    const paquetes = await prisma.producto.findMany({
      where: {
        tipo: { nombre: 'paquete' },
        activo: true
      },
      include: {
        paqueteDetallesAsPaquete: {
          include: {
            producto: {
              include: {
                hospedaje: true,
                pasaje: true
              }
            }
          }
        }
      }
    });
    res.json(paquetes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener paquetes' });
  }
});

export default router;
