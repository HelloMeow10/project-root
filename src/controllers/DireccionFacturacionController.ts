import { Request, Response } from 'express';
import { prisma } from '../prismaClient';

// Obtener todas las direcciones de facturación de un cliente
export const getDireccionesFacturacion = async (req: Request, res: Response) => {
  try {
    const { userId, tipo } = req.user; // Cliente autenticado
    if (tipo !== 'cliente') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const direcciones = await prisma.direccionFacturacion.findMany({
      where: { id_cliente: userId },
    });
    res.status(200).json(direcciones);
  } catch (error) {
    console.error('Error al obtener direcciones de facturación:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Crear una nueva dirección de facturación para un cliente
export const createDireccionFacturacion = async (req: Request, res: Response) => {
  try {
    const { userId, tipo } = req.user;
    if (tipo !== 'cliente') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const { dni, calle, numero, piso, departamento, ciudad, codigo_postal, provincia, pais, es_principal } = req.body;

    if (!dni || !calle || !ciudad || !codigo_postal || !provincia || !pais) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para la dirección de facturación.' });
    }
    
    // Si es_principal es true, asegurarse de que no haya otra principal para este cliente
    if (es_principal === true) {
      await prisma.direccionFacturacion.updateMany({
        where: { id_cliente: userId, es_principal: true },
        data: { es_principal: false },
      });
    }

    const nuevaDireccion = await prisma.direccionFacturacion.create({
      data: {
        id_cliente: userId,
        dni,
        calle,
        numero,
        piso,
        departamento,
        ciudad,
        codigo_postal,
        provincia,
        pais,
        es_principal: es_principal === undefined ? false : es_principal,
      },
    });
    res.status(201).json(nuevaDireccion);
  } catch (error) {
    console.error('Error al crear dirección de facturación:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Actualizar una dirección de facturación existente
export const updateDireccionFacturacion = async (req: Request, res: Response) => {
  try {
    const { userId, tipo } = req.user;
    const { direccionId } = req.params; 
    
    if (tipo !== 'cliente') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const direccion = await prisma.direccionFacturacion.findUnique({
        where: { id_direccion: parseInt(direccionId) }
    });

    if (!direccion || direccion.id_cliente !== userId) {
        return res.status(404).json({ error: 'Dirección no encontrada o no pertenece al usuario.' });
    }

    const { dni, calle, numero, piso, departamento, ciudad, codigo_postal, provincia, pais, es_principal } = req.body;
    
    // Si es_principal es true, asegurarse de que no haya otra principal para este cliente
    if (es_principal === true && !direccion.es_principal) { // Solo si se está cambiando a principal
      await prisma.direccionFacturacion.updateMany({
        where: { id_cliente: userId, es_principal: true, NOT: { id_direccion: parseInt(direccionId) } },
        data: { es_principal: false },
      });
    }

    const updatedDireccion = await prisma.direccionFacturacion.update({
      where: { id_direccion: parseInt(direccionId) },
      data: {
        dni,
        calle,
        numero,
        piso,
        departamento,
        ciudad,
        codigo_postal,
        provincia,
        pais,
        es_principal,
      },
    });
    res.status(200).json(updatedDireccion);
  } catch (error) {
    console.error('Error al actualizar dirección de facturación:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Eliminar una dirección de facturación
export const deleteDireccionFacturacion = async (req: Request, res: Response) => {
  try {
    const { userId, tipo } = req.user;
    const { direccionId } = req.params;

    if (tipo !== 'cliente') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const direccion = await prisma.direccionFacturacion.findUnique({
        where: { id_direccion: parseInt(direccionId) }
    });

    if (!direccion || direccion.id_cliente !== userId) {
        return res.status(404).json({ error: 'Dirección no encontrada o no pertenece al usuario.' });
    }
    
    // Opcional: verificar si la dirección está siendo usada en algún pedido no finalizado
    // Por ahora, permitimos la eliminación.

    await prisma.direccionFacturacion.delete({
      where: { id_direccion: parseInt(direccionId) },
    });
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error al eliminar dirección de facturación:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Obtener una dirección de facturación específica
export const getDireccionFacturacionById = async (req: Request, res: Response) => {
  try {
    const { userId, tipo } = req.user;
    const { direccionId } = req.params;

    if (tipo !== 'cliente') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const direccion = await prisma.direccionFacturacion.findFirst({
      where: { 
        id_direccion: parseInt(direccionId),
        id_cliente: userId 
      },
    });

    if (!direccion) {
      return res.status(404).json({ error: 'Dirección no encontrada o no pertenece al usuario.' });
    }
    res.status(200).json(direccion);
  } catch (error) {
    console.error('Error al obtener la dirección de facturación:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
