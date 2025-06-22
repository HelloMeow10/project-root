import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';
import { prisma } from '../config/db'; // Para validación de email

const orderService = new OrderService();

/**
 * Obtiene todos los pedidos. Solo para administradores.
 * Permite filtrar por estado y ID de cliente, y ordenar.
 * @async
 * @function getAllOrders
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.tipo`. Query params opcionales: `estado`, `id_cliente`, `ordenPor`, `direccionOrden`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con la lista de pedidos o un error.
 */
export async function getAllOrders(req: Request, res: Response, next: NextFunction) {
  try {
    // Solo admin debería ver todos los pedidos
    if (req.user?.tipo !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para ver todos los pedidos.' });
    }

    const { estado, id_cliente, ordenPor, direccionOrden } = req.query;

    const filtros: { estado?: string; id_cliente?: number } = {};
    if (estado) filtros.estado = String(estado);
    if (id_cliente) filtros.id_cliente = Number(id_cliente);

    const orden: { campo?: string; direccion?: 'asc' | 'desc' } = {};
    if (ordenPor) orden.campo = String(ordenPor);
    if (direccionOrden && (String(direccionOrden) === 'asc' || String(direccionOrden) === 'desc')) {
      orden.direccion = String(direccionOrden) as 'asc' | 'desc';
    } else if (ordenPor) {
      orden.direccion = 'asc'; // Dirección por defecto si solo se provee el campo
    }
    
    const orders = await orderService.obtenerPedidos(
      Object.keys(filtros).length > 0 ? filtros : undefined,
      orden.campo ? orden : undefined
    );
    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
}

/**
 * Obtiene todos los pedidos del usuario actualmente autenticado.
 * @async
 * @function getMyOrders
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con los pedidos del usuario o un error.
 */
export async function getMyOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    const orders = await orderService.obtenerPedidosPorCliente(userId);
    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
}

/**
 * Obtiene un pedido específico por su ID.
 * Solo el propietario del pedido o un administrador pueden acceder.
 * @async
 * @function getOrderById
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId`, `req.user.tipo` y `req.params.id`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con el pedido o un error.
 */
export async function getOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID de pedido inválido.' });
    }
    const order = await orderService.obtenerPedidoPorId(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }
    // Solo el dueño o admin puede ver el pedido
    if (req.user?.tipo !== 'admin' && order.id_cliente !== req.user?.userId) {
      return res.status(403).json({ message: 'No autorizado para ver este pedido.' });
    }
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
}

/**
 * Crea un nuevo pedido a partir del carrito del usuario actual.
 * Valida que el email del cliente esté verificado.
 * @async
 * @function createOrder
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId`. Opcional en `req.body`: `id_direccion_facturacion`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con el nuevo pedido creado o un error.
 */
export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }

    // Validar que el email esté verificado antes de crear un pedido
    const cliente = await prisma.cliente.findUnique({ where: { id_cliente: userId } });
    if (!cliente?.email_verificado) {
      return res.status(403).json({ message: 'Debes verificar tu email antes de crear un pedido.' });
    }
    
    }

    const { id_direccion_facturacion, items } = req.body;

    // Validar que 'items' se proporciona y es un array con elementos.
    // El OrderService espera estos items para procesar detalles adicionales (vuelos, etc.)
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Debes enviar los items del pedido con sus detalles (ej. selección de asientos, equipaje).' });
    }

    const newOrder = await orderService.crearPedidoDesdeCarrito(
      userId,
      items, // Pasar los items del req.body al servicio
      id_direccion_facturacion ? Number(id_direccion_facturacion) : undefined
    );
    res.status(201).json(newOrder);
  } catch (err: any) {
    if (err.message && (err.message.includes('carrito está vacío') || err.message.includes('Stock insuficiente') || err.message.includes('ya no está disponible'))) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

/**
 * Actualiza un pedido existente.
 * Los administradores pueden actualizar el estado y la dirección de facturación.
 * Los clientes solo pueden cancelar sus propios pedidos si están pendientes de pago.
 * @async
 * @function updateOrder
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.userId`, `req.user.tipo`, `req.params.id`. En `req.body`: `estado` y/o `id_direccion_facturacion`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con el pedido actualizado o un error.
 */
export async function updateOrder(req: Request, res: Response, next: NextFunction) {
  // Principalmente para que un admin actualice el estado del pedido, por ejemplo.
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID de pedido inválido.' });
    }
    
    const order = await orderService.obtenerPedidoPorId(id); // Para verificar existencia
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    const { estado, id_direccion_facturacion } = req.body;
    const dataToUpdate: any = {};

    if (req.user?.tipo === 'admin') {
      // Admin puede actualizar estado y dirección de facturación
      if (estado) dataToUpdate.estado = estado;
      if (id_direccion_facturacion) dataToUpdate.id_direccion_facturacion = Number(id_direccion_facturacion);
    } else if (req.user?.userId === order.id_cliente) {
      // Cliente solo puede cancelar su propio pedido si está PENDIENTE_PAGO
      if (estado === 'CANCELADO') {
        if (order.estado === 'PENDIENTE_PAGO') {
          dataToUpdate.estado = 'CANCELADO';
        } else {
          return res.status(403).json({ message: 'Solo puedes cancelar pedidos pendientes de pago.' });
        }
      } else if (estado || id_direccion_facturacion) {
        // Cliente intenta modificar otros campos o a otros estados no permitidos
        return res.status(403).json({ message: 'No tienes permiso para realizar esta modificación.' });
      }
    } else {
      return res.status(403).json({ message: 'No autorizado para actualizar este pedido.' });
    }
    
    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: "No se proporcionaron datos válidos o permitidos para actualizar." });
    }

    const updated = await orderService.actualizarPedido(id, dataToUpdate);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * Elimina un pedido. Solo para administradores.
 * Nota: Usualmente los pedidos se marcan como cancelados en lugar de eliminarse físicamente.
 * @async
 * @function deleteOrder
 * @param {Request} req - El objeto de solicitud de Express. Espera `req.user.tipo` y `req.params.id`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 * @returns {Promise<void>} Envía una respuesta JSON con un mensaje de éxito o un error.
 */
export async function deleteOrder(req: Request, res: Response, next: NextFunction) {
  // Usualmente los pedidos no se eliminan físicamente, se marcan como cancelados.
  // Pero siguiendo la estructura actual:
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID de pedido inválido.' });
    }

    if (req.user?.tipo !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para eliminar este pedido.' });
    }

    const order = await orderService.obtenerPedidoPorId(id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }
    
    // Lógica adicional: ¿Se debe reponer el stock si se elimina un pedido?
    // Por ahora, no se implementa la reposición de stock al eliminar.

    await orderService.eliminarPedido(id);
    res.json({ message: 'Pedido eliminado.' }); // O cambiar a estado 'CANCELADO'
  } catch (err) {
    next(err);
  }
}