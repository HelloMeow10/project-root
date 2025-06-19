import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import bcrypt from 'bcrypt';
import { prisma } from '../prismaClient';
import { enviarBienvenida } from '../mailer';

const userService = new UserService();

export const getAllUsuariosInternos = async (req: Request, res: Response) => {
  try {
    const data = await userService.obtenerUsuariosInternos();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios internos' });
  }
};

export const getAllClientes = async (req: Request, res: Response) => {
  try {
    const data = await userService.obtenerClientes();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

export const createUsuarioInterno = async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, email, contrasena, telefono, id_rol } = req.body;
    // Valida datos aquí
    const hashed = await bcrypt.hash(contrasena, 10);
    const nuevo = await prisma.usuarioInterno.create({
      data: { nombre, apellido, email, contrasena: hashed, telefono, id_rol }
    });
    await enviarBienvenida(nuevo.email, nuevo.nombre);
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario interno' });
  }
};

export const toggleActivoUsuarioInterno = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { activo } = req.body;
  try {
    await prisma.usuarioInterno.update({
      where: { id_usuario: Number(id) }, // <--- aquí el cambio
      data: { activo }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
};

export const eliminarUsuarioInterno = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.usuarioInterno.delete({
      where: { id_usuario: Number(id) } // <--- aquí el cambio
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

export const obtenerUsuarioInternoPorId = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const usuario = await prisma.usuarioInterno.findUnique({
      where: { id_usuario: Number(id) }
    });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

export const editarUsuarioInterno = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, apellido, email, telefono, id_rol } = req.body;
  try {
    await prisma.usuarioInterno.update({
      where: { id_usuario: Number(id) },
      data: { nombre, apellido, email, telefono, id_rol }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

export const obtenerUsuarios = async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuarioInterno.findMany({
      select: {
        id_usuario: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        activo: true,
        id_rol: true
      }
    });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// --- Funciones CRUD para Clientes ---

export const editarCliente = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, apellido, email, telefono, direccion } = req.body;

  const idCliente = Number(id);
  if (isNaN(idCliente)) {
    return res.status(400).json({ message: 'ID de cliente inválido.' });
  }

  try {
    const clienteExistente = await prisma.cliente.findUnique({
      where: { id_cliente: idCliente },
    });

    if (!clienteExistente) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    const updatedCliente = await prisma.cliente.update({
      where: { id_cliente: idCliente },
      data: {
        nombre,
        apellido,
        email,
        telefono,
        direccion,
        // Nota: No se actualiza la contraseña aquí
      },
    });
    res.json({ message: 'Cliente actualizado con éxito.', cliente: updatedCliente });
  } catch (error: any) {
    console.error('Error al editar cliente:', error);
    if (error.code === 'P2025') { // "Record to update not found" - aunque ya validamos arriba, es una salvaguarda
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    // Manejo de otros posibles errores, como violación de constraint unique para email
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(409).json({ message: 'El email proporcionado ya está en uso por otro cliente.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al actualizar el cliente.' });
  }
};

export const toggleActivoCliente = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { activo } = req.body;

  const idCliente = Number(id);
  if (isNaN(idCliente)) {
    return res.status(400).json({ message: 'ID de cliente inválido.' });
  }

  if (typeof activo !== 'boolean') {
    return res.status(400).json({ message: 'El valor de "activo" debe ser un booleano.' });
  }

  try {
    const clienteExistente = await prisma.cliente.findUnique({
      where: { id_cliente: idCliente },
    });

    if (!clienteExistente) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    const updatedCliente = await prisma.cliente.update({
      where: { id_cliente: idCliente },
      data: { activo },
    });

    res.json({
        message: `Cliente ${activo ? 'activado' : 'desactivado'} con éxito.`,
        cliente: updatedCliente

    });
  } catch (error: any) {
    console.error('Error al cambiar estado activo del cliente:', error);
     if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al cambiar el estado del cliente.' });
  }
};

export const eliminarCliente = async (req: Request, res: Response) => {
  const { id } = req.params;
  const idCliente = Number(id);

  if (isNaN(idCliente)) {
    return res.status(400).json({ message: 'ID de cliente inválido.' });
  }

  try {
    // Primero verificamos si el cliente existe, ya que Prisma delete no falla si no existe si no se usa findUniqueOrThrow
     const clienteExistente = await prisma.cliente.findUnique({
      where: { id_cliente: idCliente },
    });

    if (!clienteExistente) {
      return res.status(404).json({ message: 'Cliente no encontrado para eliminar.' });
    }

    await prisma.cliente.delete({
      where: { id_cliente: idCliente },
    });
    res.json({ message: 'Cliente eliminado con éxito.' });
  } catch (error: any) {
    console.error('Error al eliminar cliente:', error);
    // El código P2025 significa "Record to delete does not exist."
    // Aunque ya lo verificamos arriba, es una buena práctica tenerlo por si la lógica cambia.
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Cliente no encontrado para eliminar.' });
    }
    // Otros errores pueden ser por restricciones de clave foránea, etc.
    // Por ejemplo, P2003: Foreign key constraint failed on the field: `field_name`
    if (error.code === 'P2003') {
        return res.status(409).json({ message: 'No se puede eliminar el cliente porque tiene registros asociados (ej. pedidos).', details: error.meta?.field_name });
    }
    res.status(500).json({ message: 'Error interno del servidor al eliminar el cliente.' });
  }
};