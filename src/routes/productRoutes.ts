// src/routes/productRoutes.ts
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { deleteProduct } from '../controllers/ProductController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminOnly } from '../middlewares/adminOnly';
import * as ProductController from '../controllers/ProductController';

const router = Router();
const prisma = new PrismaClient();

// Extensión del tipo Request para incluir `user`

// Endpoint para obtener todos los paquetes turísticos
router.get('/paquetes', async (req, res) => {
  try {
    const tipoPaquete = await prisma.tipoProducto.findUnique({
      where: { nombre: 'paquete' },
    });

    if (!tipoPaquete) {
      console.error("TipoProducto 'paquete' not found in database.");
      return res.status(404).json({ message: "Tipo de producto 'paquete' no configurado." });
    }
    const paqueteTipoId = tipoPaquete.id_tipo;

    const paquetes = await prisma.producto.findMany({
      where: { id_tipo: paqueteTipoId, activo: true }, // Use the fetched ID
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
  } catch (err: any) {
    console.error('Error al obtener paquetes:', err);
    res.status(500).json({ message: 'Error al obtener paquetes', error: err.message });
  }
});

// Endpoint para obtener solo los vuelos (CORREGIDO)
router.get('/vuelos', async (req, res) => {
  try {
    const tipoVuelo = await prisma.tipoProducto.findUnique({
      where: { nombre: 'vuelo' },
    });

    if (!tipoVuelo) {
      return res.status(404).json({ message: "Tipo de producto 'vuelo' no configurado." });
    }

    const vuelos = await prisma.producto.findMany({
      where: { id_tipo: tipoVuelo.id_tipo, activo: true },
      include: {
        pasaje: {
          // Removed tipoAsiento include as it does not exist in the schema
        }
      }
    });
    res.json(vuelos);
  } catch (err) {
    console.error('Error al obtener vuelos:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: 'Error al obtener vuelos', error: errorMessage });
  }
});

// Endpoint para obtener solo los hoteles
router.get('/hoteles', async (req, res) => {
  const hoteles = await prisma.producto.findMany({
    where: { id_tipo: 3, activo: true },
    include: { hospedaje: true }
  });
  res.json(hoteles);
});

// Endpoint para crear pedidos
router.post('/pedidos', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Validar productos y calcular total
    let subtotal = 0;
    const itemsToCreate = [];
    for (const item of items) {
      const producto = await prisma.producto.findUnique({
        where: { id_producto: item.id_producto }
      });
      if (!producto) {
        return res.status(400).json({ message: `Producto no encontrado: ${item.id_producto}` });
      }
      subtotal += Number(producto.precio) * item.cantidad;
      itemsToCreate.push({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio: Number(producto.precio)
      });
    }

    // Sumar IVA (21%)
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    // Crear el pedido
    const pedido = await prisma.pedido.create({
      data: {
        id_cliente: userId,
        estado: 'pendiente',
        total,
        items: {
          create: itemsToCreate
        }
      },
      include: { items: true }
    });

    res.json({ id: pedido.id_pedido, items: pedido.items, total: pedido.total });
  } catch (err: any) {
    console.error('Error al crear el pedido:', err);
    res.status(500).json({ message: 'Error al crear el pedido', error: err.message });
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
        alquiler: true
      }
    });

    res.json(autos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener autos' });
  }
});

router.get(
  '/individuals', 
  // authMiddleware, // Consider if auth is needed for just listing individuals for an admin
  ProductController.getIndividualProducts // New controller method
);

// Endpoint para obtener todos los productos
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', ProductController.createProduct); // <-- ESTA LÍNEA ES CLAVE
router.put('/:id', authMiddleware, adminOnly, ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

router.post(
  '/paquetes/:id_paquete/details', 
  authMiddleware, 
  adminOnly, 
  ProductController.agregarComponenteAPaquete // New controller method
);

router.delete(
  '/paquetes/:id_paquete/details/:id_producto_componente', 
  authMiddleware, 
  adminOnly, 
  ProductController.eliminarComponenteDePaquete // New controller method
);

// --- NUEVAS RUTAS PARA FUNCIONALIDADES DE VUELO ---

// Endpoint para obtener el mapa de asientos de un pasaje específico
router.get(
  '/pasajes/:idProductoPasaje/mapa-asientos',
  // authMiddleware, // Descomentar si se requiere autenticación para ver el mapa
  ProductController.getAvionMapaAsientos
);

// Endpoint para obtener todas las opciones de equipaje activas
router.get(
  '/opciones-equipaje',
  // authMiddleware, // Descomentar si se requiere autenticación
  ProductController.getOpcionesEquipaje
);

// Endpoint para obtener las clases de servicio (tipos de asiento) disponibles
router.get(
  '/clases-servicio',
  // authMiddleware, // Descomentar si se requiere autenticación
  ProductController.getClasesServicio
);

// --- FIN DE NUEVAS RUTAS ---

export default router;
