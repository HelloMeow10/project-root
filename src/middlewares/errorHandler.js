"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Error interno del servidor' });
}
