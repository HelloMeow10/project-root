import { Request, Response } from 'express';
import { prisma } from '../prismaClient';

/**
 * Obtiene el contenido del carrito del usuario actual.
 * Valida que el email del cliente esté verificado.
 * Limpia items huérfanos del carrito si el producto asociado ya no existe.
 * @async
 * @function getCart
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Envía una respuesta JSON con los items del carrito o un error.
 */
export async function getCart(req: Request, res: Response) {
  console.log('NEW GETCART: Executing getCart function - Start');
  const userId = (req as any).user.userId;
  const cliente = await prisma.cliente.findUnique({ where: { id_cliente: userId } });
  if (!cliente?.email_verificado) {
    console.log('NEW GETCART: Email not verified, returning 403');
    return res.status(403).json({ message: 'Debes verificar tu email para ver el carrito.' });
  }

  // 1. Fetch the user's cart and its basic items
  const carrito = await prisma.carrito.findFirst({
    where: { id_cliente: userId },
    include: {
      items: true // Just CarritoItems, no deep product include yet
    }
  });

  if (!carrito || !carrito.items || carrito.items.length === 0) {
    console.log('NEW GETCART: Returning data:', []);
    return res.json([]); // Return empty array if no cart or no items
  }

  // 2. Extract all unique product IDs from cart items
  const productoIds = [...new Set(carrito.items.map(item => item.id_producto))];

  if (productoIds.length === 0) {
      // This case should ideally not be reached if carrito.items was not empty,
      // but as a safeguard:
      if (carrito.items.length > 0) {
        // If there were items but no product IDs (e.g. all items had null/undefined id_producto)
        // then these are all orphans.
        const orphanItemIds = carrito.items.map(i => i.id_item);
        if (orphanItemIds.length > 0) {
          await prisma.carritoItem.deleteMany({
            where: { id_item: { in: orphanItemIds } }
          });
        }
      }
      console.log('NEW GETCART: Returning data:', []);
      return res.json([]);
  }

  // 3. Fetch all corresponding products with their types
  const productos = await prisma.producto.findMany({
    where: {
      id_producto: { in: productoIds }
    },
    include: {
      tipoProducto: true // Include the product type
    }
  });

  // 4. Create a map of productId to Product for easy lookup
  const productoMap = new Map(productos.map(p => [p.id_producto, p]));

  const validItems = [];
  const orphanItemIds = [];

  // 5. Iterate through original cart items, validate, and build response
  for (const item of carrito.items) {
    const productoDetallado = productoMap.get(item.id_producto);
    if (productoDetallado) {
      // Product exists, create the item structure the frontend expects
      validItems.push({
        ...item, // Spread CarritoItem properties (id_item, id_carrito, cantidad)
        producto: productoDetallado // Add the full product details
      });
    } else {
      // Product not found, mark this CarritoItem as an orphan
      orphanItemIds.push(item.id_item);
    }
  }

  // 6. Delete orphan CarritoItems
  if (orphanItemIds.length > 0) {
    await prisma.carritoItem.deleteMany({
      where: {
        id_item: { in: orphanItemIds }
      }
    });
    console.log(`Deleted ${orphanItemIds.length} orphan cart items.`);
  }

  // 7. Return only the valid items
  console.log('NEW GETCART: Returning data:', validItems);
  return res.json(validItems);
}

/**
 * Agrega un producto al carrito del usuario actual o actualiza su cantidad si ya existe.
 * Valida que el email del cliente esté verificado y que el producto exista y esté activo.
 * Verifica el stock del producto.
 * @async
 * @function addToCart
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId` y en `req.body`: `productId` y `cantidad` (opcional, default 1).
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Envía una respuesta JSON con el item del carrito creado/actualizado o un error.
 */
export async function addToCart(req: Request, res: Response) {
  const userId = (req as any).user.userId;
  // Validar que el email esté verificado
  const cliente = await prisma.cliente.findUnique({ where: { id_cliente: userId } });
  if (!cliente?.email_verificado) {
    return res.status(403).json({ message: 'Debes verificar tu email antes de agregar productos al carrito.' });
  }
  // Solo una declaración de productId y cantidad
  const { productId, cantidad: cantidadSolicitada } = req.body;

  // Validación explícita de productId
  if (!productId || isNaN(Number(productId))) {
    return res.status(400).json({ message: 'El campo productId es requerido y debe ser un número válido.' });
  }
  const idProducto = Number(productId);

  // Validación de cantidad
  const cantidadFinal = Number(cantidadSolicitada) || 1;
  if (!Number.isInteger(cantidadFinal) || cantidadFinal <= 0) {
    return res.status(400).json({ message: 'La cantidad debe ser un entero positivo.' });
  }

  // Verificar que el producto exista y esté activo
  const producto = await prisma.producto.findUnique({
    where: { id_producto: idProducto },
  });

  if (!producto) {
    return res.status(404).json({ message: 'Producto no encontrado.' });
  }
  if (!producto.activo) {
    return res.status(400).json({ message: 'Este producto ya no está disponible.' });
  }

  // Busca o crea el carrito del usuario (solo una vez)
  let carrito = await prisma.carrito.findFirst({ where: { id_cliente: userId } });
  if (!carrito) {
    carrito = await prisma.carrito.create({ data: { id_cliente: userId } });
  }

  // Verificar si el item ya existe en el carrito
  let itemEnCarrito = await prisma.carritoItem.findFirst({
    where: {
      id_carrito: carrito.id_carrito,
      id_producto: idProducto,
    },
  });

  if (itemEnCarrito) {
    // Producto ya existe en el carrito, actualizar cantidad
    const nuevaCantidad = itemEnCarrito.cantidad + cantidadFinal;
    if (producto.stock !== null && nuevaCantidad > producto.stock) {
      return res.status(400).json({ message: `Stock insuficiente. Solo quedan ${producto.stock} unidades.` });
    }
    itemEnCarrito = await prisma.carritoItem.update({
      where: { id_item: itemEnCarrito.id_item },
      data: { cantidad: nuevaCantidad },
    });
    res.status(200).json(itemEnCarrito);
  } else {
    // Producto no existe en el carrito, crear nuevo item
    if (producto.stock !== null && cantidadFinal > producto.stock) {
      return res.status(400).json({ message: `Stock insuficiente. Solo quedan ${producto.stock} unidades.` });
    }
    const nuevoItem = await prisma.carritoItem.create({
      data: {
        id_carrito: carrito.id_carrito,
        id_producto: idProducto,
        cantidad: cantidadFinal,
      },
    });
    res.status(201).json(nuevoItem);
  }
}

/**
 * Actualiza la cantidad de un item específico en el carrito del usuario.
 * Si la cantidad es 0, elimina el item.
 * Valida el stock del producto.
 * @async
 * @function updateCartItem
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId`, `req.params.itemId` y en `req.body`: `cantidad`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Envía una respuesta JSON con el item actualizado o un mensaje de éxito/error.
 */
export async function updateCartItem(req: Request, res: Response) {
  const userId = (req as any).user.userId;
  const itemId = parseInt(req.params.itemId, 10);
  const { cantidad } = req.body;

  if (isNaN(itemId)) {
    return res.status(400).json({ message: 'ID de item inválido.' });
  }
  if (cantidad === undefined || !Number.isInteger(cantidad) || cantidad < 0) {
    return res.status(400).json({ message: 'La cantidad debe ser un entero no negativo.' });
  }

  try {
    const item = await prisma.carritoItem.findFirst({
      where: { id_item: itemId, carrito: { id_cliente: userId } },
      include: { producto: true }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item del carrito no encontrado o no pertenece al usuario.' });
    }

    if (cantidad === 0) {
      await prisma.carritoItem.delete({ where: { id_item: itemId } });
      return res.status(200).json({ message: 'Item eliminado del carrito.' });
    }

    if (item.producto.stock !== null && cantidad > item.producto.stock) {
      return res.status(400).json({ message: `Stock insuficiente. Solo quedan ${item.producto.stock} unidades.` });
    }

    const updatedItem = await prisma.carritoItem.update({
      where: { id_item: itemId },
      data: { cantidad },
    });
    res.status(200).json(updatedItem);

  } catch (error) {
    console.error('Error al actualizar item del carrito:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

/**
 * Elimina un item específico del carrito del usuario.
 * @async
 * @function removeCartItem
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId` y `req.params.itemId`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Envía una respuesta JSON con un mensaje de éxito o un error.
 */
export async function removeCartItem(req: Request, res: Response) {
  const userId = (req as any).user.userId;
  const itemId = parseInt(req.params.itemId, 10);

  if (isNaN(itemId)) {
    return res.status(400).json({ message: 'ID de item inválido.' });
  }

  try {
    const item = await prisma.carritoItem.findFirst({
      where: { id_item: itemId, carrito: { id_cliente: userId } },
    });

    if (!item) {
      return res.status(404).json({ message: 'Item del carrito no encontrado o no pertenece al usuario.' });
    }

    await prisma.carritoItem.delete({ where: { id_item: itemId } });
    res.status(200).json({ message: 'Item eliminado del carrito exitosamente.' });

  } catch (error) {
    console.error('Error al eliminar item del carrito:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}

/**
 * Vacía todos los items del carrito del usuario actual.
 * @async
 * @function clearCart
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @returns {Promise<void>} Envía una respuesta JSON con un mensaje de éxito o un error.
 */
export async function clearCart(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const carrito = await prisma.carrito.findFirst({ where: { id_cliente: userId } });
    if (!carrito) return res.status(200).json({ message: 'Carrito ya vacío' });

    await prisma.carritoItem.deleteMany({ where: { id_carrito: carrito.id_carrito } });

    res.json({ message: 'Carrito vaciado exitosamente' });
  } catch (err) {
    console.error('Error al vaciar carrito:', err);
    res.status(500).json({ message: 'Error al vaciar carrito', error: err });
  }
}