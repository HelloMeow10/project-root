import { prisma } from '../config/db'; // Usaremos prisma client directamente para transacciones
import { OrderRepository } from '../repositories/OrderRepository'; // Aún podemos usarlo para otras ops si es necesario

/**
 * @class OrderService
 * @description Proporciona métodos para la gestión de pedidos.
 */
export class OrderService {
  private orderRepository: OrderRepository;

  /**
   * Crea una instancia de OrderService.
   */
  constructor() {
    this.orderRepository = new OrderRepository(); // Puede ser útil para get/update/delete
  }

  /**
   * Obtiene una lista de pedidos, con opciones de filtrado y ordenación.
   * @async
   * @method obtenerPedidos
   * @param {object} [filtros] - Opciones de filtrado.
   * @param {string} [filtros.estado] - Filtrar por estado del pedido.
   * @param {number} [filtros.id_cliente] - Filtrar por ID de cliente.
   * @param {object} [orden] - Opciones de ordenación.
   * @param {string} [orden.campo] - Campo por el cual ordenar.
   * @param {'asc' | 'desc'} [orden.direccion] - Dirección de la ordenación.
   * @returns {Promise<Array<object>>} Una lista de pedidos con sus detalles.
   */
  async obtenerPedidos(filtros?: { estado?: string; id_cliente?: number }, orden?: { campo?: string; direccion?: 'asc' | 'desc' }) {
    const whereClause: any = {};
    if (filtros?.estado) {
      whereClause.estado = filtros.estado;
    }
    if (filtros?.id_cliente) {
      whereClause.id_cliente = filtros.id_cliente;
    }

    const orderByClause: any = {};
    if (orden?.campo && orden?.direccion) {
      if (orden.campo === 'cliente') {
        // Ordenar por nombre de cliente requiere un join o una forma diferente si se hace directo en Prisma
        // Por ahora, si es por cliente, podríamos ordenar por id_cliente o nombre si el cliente está en el include
        // Esto es más complejo y podría requerir post-procesamiento o una query más específica.
        // Simplificación: ordenar por fecha_pedido si el campo es 'cliente' para evitar complejidad ahora.
        orderByClause['cliente'] = { nombre: orden.direccion }; // Asume que se puede ordenar por campo de relación
      } else {
        orderByClause[orden.campo] = orden.direccion;
      }
    } else {
      orderByClause['fecha_pedido'] = 'desc'; // Orden por defecto
    }

    return prisma.pedido.findMany({
      where: whereClause,
      include: { 
        cliente: true, // Necesario para ordenar por nombre de cliente o mostrar info
        items: { include: { producto: true } }, 
        pagos: true 
      },
      orderBy: orderByClause,
    });
  }

  /**
   * Obtiene todos los pedidos de un cliente específico.
   * @async
   * @method obtenerPedidosPorCliente
   * @param {number} idCliente - El ID del cliente.
   * @returns {Promise<Array<object>>} Una lista de pedidos del cliente.
   */
  async obtenerPedidosPorCliente(idCliente: number) {
    return prisma.pedido.findMany({
      where: { id_cliente: idCliente },
      include: { items: { include: { producto: true } }, pagos: true },
      orderBy: { fecha_pedido: 'desc' }
    });
  }

  /**
   * Obtiene un pedido específico por su ID.
   * @async
   * @method obtenerPedidoPorId
   * @param {number} id - El ID del pedido.
   * @returns {Promise<object | null>} El objeto del pedido con sus detalles, o null si no se encuentra.
   */
  async obtenerPedidoPorId(id: number) {
    return prisma.pedido.findUnique({
      where: { id_pedido: id },
      include: { cliente: true, items: { include: { producto: true } }, pagos: true },
    });
  }

  /**
   * Crea un nuevo pedido a partir del carrito de un cliente.
   * Realiza validaciones de stock y disponibilidad de productos.
   * Actualiza el stock de los productos y vacía el carrito del usuario dentro de una transacción.
   * @async
   * @method crearPedidoDesdeCarrito
   * @param {number} idCliente - El ID del cliente para el cual crear el pedido.
   * @param {number} [idDireccionFacturacion] - El ID opcional de la dirección de facturación a asociar con el pedido.
   * @returns {Promise<object>} El nuevo pedido creado con sus detalles.
   * @throws {Error} Si el carrito está vacío, un producto no está disponible/activo, o no hay stock suficiente.
   */
  async crearPedidoDesdeCarrito(idCliente: number, idDireccionFacturacion?: number) {
    const carrito = await prisma.carrito.findFirst({
      where: { id_cliente: idCliente },
      include: {
        items: {
          include: {
            producto: true, // Incluir detalles del producto para stock y precio
          },
        },
      },
    });

    if (!carrito || carrito.items.length === 0) {
      throw new Error('El carrito está vacío.');
    }

    // Validaciones y preparación de datos de pedido
    const itemsPedidoData: any[] = [];
    let totalPedido = 0;

    for (const item of carrito.items) {
      if (!item.producto) {
        throw new Error(`Producto con ID ${item.id_producto} no encontrado en el carrito.`);
      }
      if (!item.producto.activo) {
        throw new Error(`El producto "${item.producto.nombre}" ya no está disponible.`);
      }
      if (item.producto.stock !== null && item.cantidad > item.producto.stock) {
        throw new Error(`Stock insuficiente para el producto "${item.producto.nombre}". Solicitado: ${item.cantidad}, Disponible: ${item.producto.stock}`);
      }

      itemsPedidoData.push({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio: item.producto.precio, // Usar el precio actual del producto
      });
      totalPedido += item.producto.precio * item.cantidad;
    }

    // Usar transacción de Prisma
    return prisma.$transaction(async (tx) => {
      // 1. Crear el Pedido
      const nuevoPedido = await tx.pedido.create({
        data: {
          id_cliente: idCliente,
          total: totalPedido,
          estado: 'PENDIENTE_PAGO', // Estado inicial del pedido
          id_direccion_facturacion: idDireccionFacturacion,
          items: {
            create: itemsPedidoData,
          },
        },
        include: {
          items: { include: { producto: true } },
          cliente: true,
        }
      });

      // 2. Actualizar el stock de los productos
      for (const item of carrito.items) {
        if (item.producto.stock !== null) { // Solo actualizar si el stock no es ilimitado
          await tx.producto.update({
            where: { id_producto: item.id_producto },
            data: { stock: { decrement: item.cantidad } },
          });
        }
      }

      // 3. Vaciar el carrito del usuario
      await tx.carritoItem.deleteMany({
        where: { id_carrito: carrito.id_carrito },
      });
      // Opcionalmente, eliminar el carrito si se desea que se cree uno nuevo la próxima vez.
      // await tx.carrito.delete({ where: { id_carrito: carrito.id_carrito } });


      return nuevoPedido;
    });
  }
  
  // El crearPedido original que usa el repositorio puede mantenerse si hay otros usos,
  // o marcarse como obsoleto/privado si crearPedidoDesdeCarrito es el principal.
  /**
   * Crea un pedido con datos proporcionados (método de bajo nivel, generalmente no usado directamente por controladores).
   * @async
   * @method crearPedidoConData
   * @param {any} data - Datos para la creación del pedido.
   * @returns {Promise<object>} El pedido creado.
   * @deprecated Usar `crearPedidoDesdeCarrito` para la lógica de negocio estándar.
   */
  async crearPedidoConData(data: any) { // Renombrado para evitar conflicto
    return this.orderRepository.create(data);
  }

  /**
   * Actualiza un pedido existente.
   * Incluye lógica para reponer stock si un pedido es cancelado.
   * @async
   * @method actualizarPedido
   * @param {number} id - El ID del pedido a actualizar.
   * @param {any} data - Los datos a actualizar en el pedido (ej. `{ estado: 'CANCELADO' }`).
   * @returns {Promise<object>} El pedido actualizado.
   * @throws {Error} Si el pedido no se encuentra.
   */
  async actualizarPedido(id: number, data: any) {
    // Aquí se podría añadir lógica de negocio, como no permitir cambiar ciertos campos
    // una vez que el pedido está en cierto estado, etc.
    const pedidoActual = await prisma.pedido.findUnique({
      where: { id_pedido: id },
      include: { items: true }
    });

    if (!pedidoActual) {
      throw new Error('Pedido no encontrado para actualizar.');
    }

    // Lógica de reposición de stock si se cancela un pedido
    if (data.estado === 'CANCELADO' && pedidoActual.estado !== 'CANCELADO') {
      return prisma.$transaction(async (tx) => {
        for (const item of pedidoActual.items) {
          if (item.id_producto) { // Asegurarse de que el item tiene un producto asociado
            const producto = await tx.producto.findUnique({ where: { id_producto: item.id_producto } });
            if (producto && producto.stock !== null) { // Solo reponer si el stock no es ilimitado
              await tx.producto.update({
                where: { id_producto: item.id_producto },
                data: { stock: { increment: item.cantidad } },
              });
            }
          }
        }
        return tx.pedido.update({
          where: { id_pedido: id },
          data, // data aquí debería ser solo { estado: 'CANCELADO' } si es cancelación
          include: { items: true, cliente: true, pagos: true },
        });
      });
    }

    // Actualización normal para otros campos o por admin
    return prisma.pedido.update({
      where: { id_pedido: id },
      data,
      include: { items: true, cliente: true, pagos: true },
    });
  }

  /**
   * Elimina un pedido de la base de datos.
   * Nota: Generalmente, los pedidos se marcan como 'CANCELADO' en lugar de eliminarse físicamente.
   * La reposición de stock no se maneja aquí; debe ser gestionada al cambiar el estado a 'CANCELADO'.
   * @async
   * @method eliminarPedido
   * @param {number} id - El ID del pedido a eliminar.
   * @returns {Promise<object>} El resultado de la operación de eliminación.
   */
  async eliminarPedido(id: number) {
    // Considerar lógica de negocio: ¿Se pueden eliminar pedidos en cualquier estado?
    // ¿O solo se marcan como cancelados?
    // Por ahora, eliminación física, PERO NO SE REPONE STOCK AQUÍ.
    // La reposición de stock debería manejarse si se cambia el estado a CANCELADO.
    // Si se elimina directamente, es una decisión administrativa que podría no implicar reposición.
    return prisma.pedido.delete({ where: { id_pedido: id } });
  }
}