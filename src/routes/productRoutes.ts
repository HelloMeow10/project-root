// src/routes/productRoutes.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

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
    // id_tipo = 2 para vuelos (ajusta si tu id_tipo de vuelos es diferente)
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
    // id_tipo = 3 para hoteles
    const hoteles = await prisma.producto.findMany({
      where: { id_tipo: 3, activo: true },
      include: { hospedaje: true }
    });
    res.json(hoteles);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener hoteles' });
  }
});

router.post('/pedidos', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const userId = req.user?.id_cliente; // Ajusta según tu auth

    if (!userId) return res.status(401).json({ message: 'No autenticado' });

    // Calcula el total sumando los precios de los productos
    let total = 0;
    for (const item of items) {
      const producto = await prisma.producto.findUnique({ where: { id_producto: item.id_producto } });
      if (!producto) return res.status(400).json({ message: 'Producto no encontrado' });
      total += Number(producto.precio) * item.cantidad;
    }

    // Crea el pedido
    const pedido = await prisma.pedido.create({
      data: {
        id_cliente: userId,
        estado: 'pendiente',
        total,
        items: {
          create: items.map((item: any) => ({
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            precio: undefined // Se setea abajo
          }))
        }
      },
      include: { items: true }
    });

    // Actualiza el precio de cada item (por si el precio cambia)
    for (const item of pedido.items) {
      const producto = await prisma.producto.findUnique({ where: { id_producto: item.id_producto } });
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

export default router;

// En tu archivo principal de servidor (por ejemplo, app.ts o server.ts)
import productRoutes from './routes/productRoutes';
app.use('/api/products', productRoutes);
