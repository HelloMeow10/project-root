"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
var jsonwebtoken_1 = require("jsonwebtoken");
function authMiddleware(req, res, next) {
    var authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: 'Token no proporcionado' });
    var token = authHeader.split(' ')[1];
    try {
        var payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Adjuntar datos del usuario al request (opcional)
        req.userId = payload.userId;
        req.userRole = payload.rol;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: 'Token inválido' });
    }
}
