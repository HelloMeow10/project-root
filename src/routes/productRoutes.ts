// src/routes/productRoutes.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { deleteProduct } from '../controllers/ProductController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminOnly } from '../middlewares/adminOnly';

const router = Router();
const prisma = new PrismaClient();

// Extensión del tipo Request para incluir `user`

// Endpoint para obtener todos los paquetes turísticos
router.get('/paquetes', async (req: Request, res: Response) => {
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

// Endpoint para obtener solo los vuelos
router.get('/vuelos', async (req: Request, res: Response) => {
  try {
    const vuelos = await prisma.producto.findMany({
      where: { id_tipo: 2, activo: true },
      include: { pasaje: true }
    });
    res.json(vuelos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener vuelos' });
  }
});

// Endpoint para obtener solo los hoteles
router.get('/hoteles', async (req: Request, res: Response) => {
  try {
    const hoteles = await prisma.producto.findMany({
      where: { id_tipo: 3, activo: true },
      include: { hospedaje: true }
    });
    res.json(hoteles);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener hoteles' });
  }
});

// Endpoint para crear pedidos
router.post('/pedidos', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const userId = (req as any).user?.id_cliente; // <--- CORREGIDO

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    let total = 0;
    for (const item of items) {
      const producto = await prisma.producto.findUnique({
        where: { id_producto: item.id_producto }
      });
      if (!producto) {
        return res.status(400).json({ message: 'Producto no encontrado' });
      }
      total += Number(producto.precio) * item.cantidad;
    }

    const pedido = await prisma.pedido.create({
      data: {
        id_cliente: userId,
        estado: 'pendiente',
        total,
        items: {
          create: items.map((item: any) => ({
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            precio: undefined // Se actualiza después
          }))
        }
      },
      include: { items: true }
    });

    for (const item of pedido.items) {
      const producto = await prisma.producto.findUnique({
        where: { id_producto: item.id_producto }
      });
      await prisma.pedidoItem.update({
        where: { id_detalle: item.id_detalle },
        data: { precio: producto?.precio || 0 }
      });
    }

    res.json({ id: pedido.id_pedido, items: pedido.items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear el pedido' });
  }
});

// Endpoint para eliminar productos
router.delete('/:id', authMiddleware, adminOnly, deleteProduct);

// Endpoint para obtener solo los autos
router.get('/autos', async (req: Request, res: Response) => {
  try {
    const tipoAuto = await prisma.tipoProducto.findFirst({
      where: { nombre: { contains: 'auto', mode: 'insensitive' } }
    });
    if (!tipoAuto) return res.json([]);

    const autos = await prisma.producto.findMany({
      where: {
        id_tipo: tipoAuto.id_tipo,
        activo: true,
        stock: { gt: 0 }
      },
      include: {
        alquiler: true,
        tipo: true // <-- agrega esto para que el producto tenga su tipo
      }
    });

    res.json(autos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener autos' });
  }
});

export default router;
