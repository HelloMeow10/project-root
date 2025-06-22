// src/controllers/AuthController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { enviarBienvenida } from '../mailer';
import { prisma } from '../config/db';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
const authService = new AuthService();

/**
 * Maneja el inicio de sesión de un usuario (cliente o administrador).
 * @async
 * @function login
 * @param {Request} req - El objeto de solicitud de Express.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, contrasena } = req.body;
    const { token, tipo } = await authService.login(email, contrasena);
    res.status(200).json({ token, tipo });
  } catch (err) {
    next(err);
  }
}

/**
 * Registra un nuevo cliente en el sistema.
 * Envía un correo de bienvenida y un correo de verificación de email.
 * @async
 * @function register
 * @param {Request} req - El objeto de solicitud de Express, que debe contener los datos del cliente en `req.body`.
 * @param {Response} res - El objeto de respuesta de Express.
 * @param {NextFunction} next - La función middleware siguiente.
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.registerCliente(req.body);
    // Envía el correo de bienvenida
    await enviarBienvenida(user.email, user.nombre);
    // Envía el correo de verificación
    await enviarEmailVerificacion(user.email, user.nombre, user.token_verificacion_email);
    res.status(201).json({ message: 'Usuario registrado. Revisa tu email para verificar tu cuenta.' });
  } catch (err: any) {
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(400).json({ message: 'El correo ya está registrado.' });
    }
    next(err);
  }
}

/**
 * Envía un correo electrónico de verificación al usuario.
 * @async
 * @function enviarEmailVerificacion
 * @param {string} email - El correo electrónico del destinatario.
 * @param {string} nombre - El nombre del destinatario.
 * @param {string} token - El token de verificación.
 */
async function enviarEmailVerificacion(email: string, nombre: string, token: string) {
  // Puedes personalizar la plantilla
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verificar-email?token=${token}`;
  const html = `<h2>Hola ${nombre},</h2><p>Gracias por registrarte. Por favor, verifica tu email haciendo clic en el siguiente enlace:</p><a href="${verifyUrl}">${verifyUrl}</a>`;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
  await transporter.sendMail({
    from: `Musimundo Travel <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Verifica tu email',
    html
  });
}

/**
 * Verifica el token de verificación de email de un cliente.
 * @async
 * @function verifyEmail
 * @param {Request} req - El objeto de solicitud de Express, que debe contener el `token` en `req.body`.
 * @param {Response} res - El objeto de respuesta de Express.
 */
export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token requerido.' });
  const user = await prisma.cliente.findFirst({ where: { token_verificacion_email: token } });
  if (!user) return res.status(400).json({ message: 'Token inválido.' });
  await prisma.cliente.update({
    where: { id_cliente: user.id_cliente },
    data: { email_verificado: true, token_verificacion_email: null }
  });
  res.json({ message: 'Email verificado correctamente.' });
}

/**
 * Maneja la solicitud de reseteo de contraseña.
 * Genera un token y envía un correo para el reseteo si el email existe.
 * @async
 * @function forgotPassword
 * @param {Request} req - El objeto de solicitud de Express, que debe contener el `email` en `req.body`.
 * @param {Response} res - El objeto de respuesta de Express.
 */
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requerido.' });
  const user = await prisma.cliente.findUnique({ where: { email } });
  if (!user) return res.status(200).json({ message: 'Si el email existe, se enviará un enlace para restablecer la contraseña.' });
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.cliente.update({
    where: { id_cliente: user.id_cliente },
    data: { token_verificacion_email: token }
  });
  await enviarResetPasswordEmail(user.email, user.nombre, token);
  res.json({ message: 'Si el email existe, se enviará un enlace para restablecer la contraseña.' });
}

/**
 * Envía un correo electrónico para el reseteo de contraseña.
 * @async
 * @function enviarResetPasswordEmail
 * @param {string} email - El correo electrónico del destinatario.
 * @param {string} nombre - El nombre del destinatario.
 * @param {string} token - El token de reseteo.
 */
async function enviarResetPasswordEmail(email: string, nombre: string, token: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-contrasena.html?token=${token}`;
  const html = `<h2>Hola ${nombre},</h2><p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p><a href="${resetUrl}">${resetUrl}</a>`;
  const transporter = require('nodemailer').createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
  await transporter.sendMail({
    from: `Musimundo Travel <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Restablece tu contraseña',
    html
  });
}

/**
 * Restablece la contraseña del usuario utilizando un token.
 * @async
 * @function resetPassword
 * @param {Request} req - El objeto de solicitud de Express, que debe contener `token` y `nuevaContrasena` en `req.body`.
 * @param {Response} res - El objeto de respuesta de Express.
 */
export async function resetPassword(req: Request, res: Response) {
  const { token, nuevaContrasena } = req.body;
  if (!token || !nuevaContrasena) return res.status(400).json({ message: 'Token y nueva contraseña requeridos.' });
  const user = await prisma.cliente.findFirst({ where: { token_verificacion_email: token } });
  if (!user) return res.status(400).json({ message: 'Token inválido.' });
  const hashed = await require('bcryptjs').hash(nuevaContrasena, 10);
  await prisma.cliente.update({
    where: { id_cliente: user.id_cliente },
    data: { contrasena: hashed, token_verificacion_email: null }
  });
  res.json({ message: 'Contraseña restablecida correctamente.' });
}

/**
 * Reenvía el correo de verificación de email para un usuario autenticado.
 * @async
 * @function resendVerificationEmail
 * @param {Request} req - El objeto de solicitud de Express, debe contener un token JWT válido en el header `Authorization`.
 * @param {Response} res - El objeto de respuesta de Express.
 */
export async function resendVerificationEmail(req: Request, res: Response) {
  try {
    // El usuario debe estar autenticado (token en Authorization)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    const token = authHeader.split(' ')[1];
    let payload: any;
    try {
      payload = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Token inválido.' });
    }
    // Debemos pedir los campos email_verificado y token_verificacion_email
    const user = await prisma.cliente.findUnique({ 
      where: { id_cliente: payload.userId },
      // @ts-ignore
      select: {
        id_cliente: true,
        email: true,
        nombre: true,
        email_verificado: true,
        token_verificacion_email: true
      }
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    if (user.email_verificado) {
      return res.status(400).json({ message: 'El email ya está verificado.' });
    }
    // Si no tiene token de verificación, genera uno nuevo
    let token_verificacion_email = user.token_verificacion_email;
    if (!token_verificacion_email) {
      token_verificacion_email = require('crypto').randomBytes(32).toString('hex');
      await prisma.cliente.update({
        where: { id_cliente: user.id_cliente },
        data: { token_verificacion_email }
      });
    }
    // Asegura que nunca sea null
    await enviarEmailVerificacion(user.email, user.nombre, token_verificacion_email || '');
    res.json({ message: 'Email de verificación reenviado.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al reenviar el email de verificación.' });
  }
}
