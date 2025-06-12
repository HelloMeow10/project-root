"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = adminOnly;
function adminOnly(req, res, next) {
    if (!req.user || req.user.tipo !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado: solo administradores.' });
    }
    next();
}
