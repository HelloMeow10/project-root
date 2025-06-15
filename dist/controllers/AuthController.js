"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.register = register;
const AuthService_1 = require("../services/AuthService");
const mailer_1 = require("../mailer");
const authService = new AuthService_1.AuthService();
async function login(req, res, next) {
    try {
        const { email, contrasena } = req.body;
        const { token, tipo } = await authService.login(email, contrasena);
        res.status(200).json({ token, tipo });
    }
    catch (err) {
        next(err);
    }
}
async function register(req, res, next) {
    var _a, _b;
    try {
        const user = await authService.registerCliente(req.body);
        // Envía el correo de bienvenida
        await (0, mailer_1.enviarBienvenida)(user.email, user.nombre);
        res.status(201).json(user);
    }
    catch (err) {
        if (err.code === 'P2002' && ((_b = (_a = err.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b.includes('email'))) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }
        next(err);
    }
}
