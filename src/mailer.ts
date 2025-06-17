import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

export async function enviarBienvenida(email: string, nombre: string) {
  try {
    // Lee la plantilla HTML desde src/mailsTemplates
    const templatePath = path.join(process.cwd(), 'src', 'mailsTemplates', 'bienvenido.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    html = html.replace('{{nombre}}', nombre);

    const info = await transporter.sendMail({
      from: `"Musimundo Travel" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '¡Bienvenido a Musimundo Travel!',
      html
    });
    console.log('Correo enviado:', info.messageId);
  } catch (error) {
    console.error('Error enviando correo:', error);
  }
}