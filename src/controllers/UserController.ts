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

export async function getAuthenticatedUserData(req: Request, res: Response) {
  try {
    const { userId, tipo } = req.user;

    if (tipo !== 'cliente') {
      return res.status(403).json({ error: 'Acceso denegado. Solo los clientes pueden acceder a esta información.' });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: userId },
      select: {
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        direccion: true,
        dni: true, // Añadir DNI aquí
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    return res.status(200).json(cliente);
  } catch (error) {
    console.error('Error al obtener datos del usuario autenticado:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

export async function updateAuthenticatedClienteData(req: Request, res: Response) {
  try {
    const { userId, tipo } = req.user; // Asumiendo que req.user es poblado por authMiddleware

    if (tipo !== 'cliente') {
      return res.status(403).json({ error: 'Acceso denegado. Solo los clientes pueden modificar esta información.' });
    }

    const { nombre, apellido, telefono, direccion, dni } = req.body;

    // Validaciones básicas (puedes expandirlas)
    if (!nombre && !apellido && !telefono && !direccion && !dni) {
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
    }

    const dataToUpdate: any = {};
    if (nombre) dataToUpdate.nombre = nombre;
    if (apellido) dataToUpdate.apellido = apellido;
    if (telefono) dataToUpdate.telefono = telefono;
    if (direccion) dataToUpdate.direccion = direccion;
    if (dni) dataToUpdate.dni = dni;

    const updatedCliente = await prisma.cliente.update({
      where: { id_cliente: userId },
      data: dataToUpdate,
      select: { // Devolver los datos actualizados, similar a getAuthenticatedUserData
        id_cliente: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        direccion: true,
        dni: true,
        email_verificado: true,
      }
    });

    return res.status(200).json(updatedCliente);
  } catch (error) {
    console.error('Error al actualizar datos del cliente autenticado:', error);
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
        return res.status(404).json({ error: 'Cliente no encontrado.' });
    }
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}