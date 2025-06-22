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
   * Calcula precios basados en clase de servicio, asiento seleccionado y equipaje adicional para vuelos.
   * Actualiza el stock de los productos y vacía el carrito del usuario dentro de una transacción.
   * @async
   * @method crearPedidoDesdeCarrito
   * @param {number} idCliente - El ID del cliente para el cual crear el pedido.
   * @param {any[]} itemsConDetallesAdicionales - Array de items del carrito, donde cada item puede tener
   *                                              `seleccion_clase_servicio_id`, `seleccion_asiento_fisico_id`,
   *                                              y `selecciones_equipaje` si es un vuelo.
   * @param {number} [idDireccionFacturacion] - El ID opcional de la dirección de facturación.
   * @returns {Promise<object>} El nuevo pedido creado con sus detalles.
   * @throws {Error} Si el carrito está vacío, un producto no está disponible/activo, o no hay stock suficiente, o datos adicionales son inválidos.
   */
  async crearPedidoDesdeCarrito(idCliente: number, itemsConDetallesAdicionales: any[], idDireccionFacturacion?: number) {
    // Primero, obtenemos el carrito real de la BD para asegurar la integridad de los datos base (producto, cantidad base)
    const carritoBD = await prisma.carrito.findFirst({
      where: { id_cliente: idCliente },
      include: {
        items: {
          include: {
            producto: { include: { tipoProducto: true, pasaje: { include: { avionConfig: true } } } },
          },
        },
      },
    });

    if (!carritoBD || carritoBD.items.length === 0) {
      throw new Error('El carrito está vacío.');
    }

    // Mapear los items del carrito de la BD para fácil acceso por id_producto
    const carritoBDItemsMap = new Map(carritoBD.items.map(item => [item.id_producto, item]));

    const itemsDataParaPedido: Array<{
      itemOriginal: typeof carritoBD.items[0];
      itemFrontend: any;
      precioUnitarioBaseProducto: number;
      precioFinalUnitarioCalculado: number;
      idClaseServicioSeleccionada?: number;
      datosAsientoSeleccionado?: { id_asiento_fisico: number; precio_seleccion_asiento: number };
      datosEquipajeSeleccionado: Array<{ id_opcion_equipaje: number; cantidad: number; precio_seleccion_equipaje: number }>;
    }> = [];

    let granTotalPedido = 0;

    // --- PRIMERA FASE: Validación y Cálculo de Precios (fuera de la transacción principal por ahora para validaciones de asiento) ---
    for (const itemFrontend of itemsConDetallesAdicionales) {
      const itemBD = carritoBDItemsMap.get(itemFrontend.id_producto);

      if (!itemBD || !itemBD.producto) {
        throw new Error(`Producto con ID ${itemFrontend.id_producto} no encontrado en el carrito o producto no existe.`);
      }
      if (!itemBD.producto.activo) {
        throw new Error(`El producto "${itemBD.producto.nombre}" ya no está disponible.`);
      }
      if (itemBD.producto.stock !== null && itemFrontend.cantidad > itemBD.producto.stock) {
        throw new Error(`Stock insuficiente para "${itemBD.producto.nombre}". Solicitado: ${itemFrontend.cantidad}, Disponible: ${itemBD.producto.stock}`);
      }

      const precioUnitarioBaseProducto = Number(itemBD.producto.precio);
      let precioUnitarioActual = precioUnitarioBaseProducto;
      let idClaseServicioSeleccionadaParaItem: number | undefined = undefined;
      let datosAsiento: { id_asiento_fisico: number; precio_seleccion_asiento: number } | undefined = undefined;
      const datosEquipaje: Array<{ id_opcion_equipaje: number; cantidad: number; precio_seleccion_equipaje: number }> = [];

      if (itemBD.producto.tipoProducto?.nombre.toLowerCase() === 'vuelo') {
        // 1. Clase de Servicio
        if (itemFrontend.seleccion_clase_servicio_id) {
          const claseServicio = await prisma.tipoAsiento.findUnique({
            where: { id_tipo_asiento: Number(itemFrontend.seleccion_clase_servicio_id) },
          });
          if (!claseServicio || !claseServicio.multiplicador_precio) {
            throw new Error(`Clase de servicio ID ${itemFrontend.seleccion_clase_servicio_id} no válida o sin multiplicador.`);
          }
          precioUnitarioActual *= Number(claseServicio.multiplicador_precio);
          idClaseServicioSeleccionadaParaItem = claseServicio.id_tipo_asiento;
        }

        // 2. Asiento Seleccionado (Validación preliminar y cálculo de precio)
        if (itemFrontend.seleccion_asiento_fisico_id) {
          if (!itemBD.producto.pasaje?.avionConfig) {
            throw new Error(`El vuelo "${itemBD.producto.nombre}" no tiene configuración de avión.`);
          }
          const asientoSeleccionado = await prisma.asiento.findUnique({
            where: { id_asiento: Number(itemFrontend.seleccion_asiento_fisico_id) },
          });
          if (!asientoSeleccionado || asientoSeleccionado.id_avion_config !== itemBD.producto.pasaje.id_avion_config) {
            throw new Error(`Asiento ID ${itemFrontend.seleccion_asiento_fisico_id} no válido para este vuelo.`);
          }
          // VALIDACIÓN DE DISPONIBILIDAD DE ASIENTO (PRELIMINAR - se hará otra vez en TX)
          const asientoOcupado = await prisma.seleccionAsientoPasajero.findFirst({
            where: {
              id_asiento_fisico: asientoSeleccionado.id_asiento,
              pedidoItem: {
                id_producto: itemBD.id_producto, // Mismo vuelo específico
                pedido: { estado: { not: 'CANCELADO' } } // En un pedido no cancelado
              }
            }
          });
          if (asientoOcupado) {
            throw new Error(`El asiento ${asientoSeleccionado.fila}${asientoSeleccionado.columna} para el vuelo "${itemBD.producto.nombre}" ya no está disponible.`);
          }
          const precioAdicionalAsiento = Number(asientoSeleccionado.precio_adicional_base) || 0;
          precioUnitarioActual += precioAdicionalAsiento;
          datosAsiento = {
            id_asiento_fisico: asientoSeleccionado.id_asiento,
            precio_seleccion_asiento: precioAdicionalAsiento,
          };
        }

        // 3. Equipaje Adicional
        if (itemFrontend.selecciones_equipaje && Array.isArray(itemFrontend.selecciones_equipaje)) {
          for (const equipaje of itemFrontend.selecciones_equipaje) {
            if (!equipaje.id_opcion_equipaje) continue;
            const opcionEquipaje = await prisma.opcionEquipaje.findUnique({
              where: { id_opcion_equipaje: Number(equipaje.id_opcion_equipaje) },
            });
            if (!opcionEquipaje || !opcionEquipaje.activo) {
              throw new Error(`Opción de equipaje ID ${equipaje.id_opcion_equipaje} no válida o inactiva.`);
            }
            const cantidadEquipaje = Number(equipaje.cantidad) || 1;
            if (cantidadEquipaje <= 0) throw new Error('La cantidad de equipaje debe ser positiva.');
            const precioPorEstaOpcionEquipaje = Number(opcionEquipaje.precio_adicional) * cantidadEquipaje;
            precioUnitarioActual += precioPorEstaOpcionEquipaje;
            datosEquipaje.push({
              id_opcion_equipaje: opcionEquipaje.id_opcion_equipaje,
              cantidad: cantidadEquipaje,
              precio_seleccion_equipaje: precioPorEstaOpcionEquipaje, // Precio total para esta opción y cantidad
            });
          }
        }
      }
      // else: para productos no-vuelo, precioUnitarioActual sigue siendo precioUnitarioBaseProducto

      const precioFinalUnitarioCalculado = precioUnitarioActual;
      const precioTotalItemCalculado = precioFinalUnitarioCalculado * itemFrontend.cantidad;

      itemsDataParaPedido.push({
        itemOriginal: itemBD,
        itemFrontend,
        precioUnitarioBaseProducto,
        precioFinalUnitarioCalculado, // Este es el precio unitario con todos los adicionales
        idClaseServicioSeleccionada: idClaseServicioSeleccionadaParaItem,
        datosAsientoSeleccionado: datosAsiento,
        datosEquipajeSeleccionado: datosEquipaje,
      });
      granTotalPedido += precioTotalItemCalculado;
    }

    // --- SEGUNDA FASE: Creación en Base de Datos dentro de una Transacción ---
    return prisma.$transaction(async (tx) => {
      const nuevoPedido = await tx.pedido.create({
        data: {
          id_cliente: idCliente,
          total: granTotalPedido,
          estado: 'PENDIENTE_PAGO',
          id_direccion_facturacion: idDireccionFacturacion,
          items: {
            create: itemsDataParaPedido.map(data => ({
              id_producto: data.itemOriginal.id_producto,
              cantidad: data.itemFrontend.cantidad,
              precio_unitario_base: data.precioUnitarioBaseProducto, // Precio original del producto
              precio_total_item: data.precioFinalUnitarioCalculado * data.itemFrontend.cantidad, // Precio final del item * cantidad
              id_clase_servicio_seleccionada: data.idClaseServicioSeleccionada,
            })),
          },
        },
        include: { items: true } // Incluir items para obtener sus IDs generados
      });

      // Crear Selecciones de Asiento y Equipaje para cada PedidoItem
      for (const dataItemProcesado of itemsDataParaPedido) {
        const pedidoItemCreado = nuevoPedido.items.find(
          pi => pi.id_producto === dataItemProcesado.itemOriginal.id_producto &&
                pi.cantidad === dataItemProcesado.itemFrontend.cantidad &&
                // Para mayor seguridad, podríamos comparar también el precio total del item si no hay duplicados exactos de producto/cantidad
                Math.abs(Number(pi.precio_total_item) - (dataItemProcesado.precioFinalUnitarioCalculado * dataItemProcesado.itemFrontend.cantidad)) < 0.001
        );

        if (!pedidoItemCreado) {
          // Esto no debería suceder si la lógica de find es correcta y no hay items idénticos (mismo producto, misma cantidad) en el pedido
          throw new Error(`No se pudo encontrar el PedidoItem correspondiente para el producto ID ${dataItemProcesado.itemOriginal.id_producto}`);
        }

        // Crear SeleccionAsientoPasajero
        if (dataItemProcesado.datosAsientoSeleccionado) {
          // VALIDACIÓN FINAL DE DISPONIBILIDAD DE ASIENTO (DENTRO DE TX)
          const asientoOcupadoTx = await tx.seleccionAsientoPasajero.findFirst({
            where: {
              id_asiento_fisico: dataItemProcesado.datosAsientoSeleccionado.id_asiento_fisico,
              pedidoItem: {
                id_producto: dataItemProcesado.itemOriginal.id_producto,
                pedido: {
                  estado: { not: 'CANCELADO' },
                  id_pedido: { not: nuevoPedido.id_pedido } // Excluir el pedido actual si se procesan varios items del mismo vuelo
                }
              }
            }
          });
          if (asientoOcupadoTx) {
            const asientoInfo = await tx.asiento.findUnique({where: {id_asiento: dataItemProcesado.datosAsientoSeleccionado.id_asiento_fisico}});
            throw new Error(`El asiento ${asientoInfo?.fila}${asientoInfo?.columna} para el vuelo "${dataItemProcesado.itemOriginal.producto.nombre}" ya no está disponible (confirmado en transacción).`);
          }

          await tx.seleccionAsientoPasajero.create({
            data: {
              id_pedido_item: pedidoItemCreado.id_detalle,
              id_asiento_fisico: dataItemProcesado.datosAsientoSeleccionado.id_asiento_fisico,
              precio_seleccion_asiento: dataItemProcesado.datosAsientoSeleccionado.precio_seleccion_asiento,
            },
          });
        }

        // Crear SeleccionEquipajePasajero
        if (dataItemProcesado.datosEquipajeSeleccionado.length > 0) {
          for (const equipajeData of dataItemProcesado.datosEquipajeSeleccionado) {
            await tx.seleccionEquipajePasajero.create({
              data: {
                id_pedido_item: pedidoItemCreado.id_detalle,
                id_opcion_equipaje: equipajeData.id_opcion_equipaje,
                cantidad: equipajeData.cantidad,
                precio_seleccion_equipaje: equipajeData.precio_seleccion_equipaje,
              },
            });
          }
        }
      }

      // Actualizar el stock de los productos base
      for (const item of carritoBD.items) {
        if (item.producto.stock !== null) {
          await tx.producto.update({
            where: { id_producto: item.id_producto },
            data: { stock: { decrement: item.cantidad } },
          });
        }
      }

      await tx.carritoItem.deleteMany({
        where: { id_carrito: carritoBD.id_carrito },
      });
      
      // Devolver el pedido con todos sus detalles, incluyendo las nuevas selecciones anidadas
      return tx.pedido.findUnique({
        where: { id_pedido: nuevoPedido.id_pedido },
        include: {
          cliente: true,
          direccionFacturacion: true,
          items: {
            include: {
              producto: { include: { tipoProducto: true }},
              claseServicioSeleccionada: true,
              seleccion_asiento: { include: { asientoFisico: { include: { tipoAsientoBase: true }} } },
              selecciones_equipaje: { include: { opcionEquipaje: true }}
            }
          },
          pagos: true
        }
      });
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