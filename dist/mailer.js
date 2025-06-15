"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarBienvenida = enviarBienvenida;
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});
async function enviarBienvenida(email, nombre) {
    try {
        // Lee la plantilla HTML desde src/mailsTemplates
        const templatePath = path_1.default.join(process.cwd(), 'src', 'mailsTemplates', 'bienvenido.html');
        let html = fs_1.default.readFileSync(templatePath, 'utf8');
        html = html.replace('{{nombre}}', nombre);
        const info = await transporter.sendMail({
            from: `"Musimundo Travel" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '¡Bienvenido a Musimundo Travel!',
            html
        });
        console.log('Correo enviado:', info.messageId);
    }
    catch (error) {
        console.error('Error enviando correo:', error);
    }
}
