"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.register = register;
const AuthService_1 = require("../services/AuthService");
const authService = new AuthService_1.AuthService();
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const token = await authService.login(email, password);
        res.status(200).json({ token });
    }
    catch (err) {
        next(err);
    }
}
async function register(req, res, next) {
    try {
        const user = await authService.register(req.body);
        res.status(201).json(user);
    }
    catch (err) {
        next(err);
    }
}
