"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.register = register;
const AuthService_1 = require("../services/AuthService");
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
    try {
        const user = await authService.registerCliente(req.body);
        res.status(201).json(user);
    }
    catch (err) {
        next(err);
    }
}
