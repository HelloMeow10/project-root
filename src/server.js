"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
var express_1 = require("express");
var cors_1 = require("cors");
var morgan_1 = require("morgan");
var dotenv_1 = require("dotenv");
var db_1 = require("./config/db");
var productRoutes_1 = require("./routes/productRoutes");
var authRoutes_1 = require("./routes/authRoutes");
var errorHandler_1 = require("./middlewares/errorHandler");
dotenv_1.default.config(); // Carga variables de entorno desde .env:contentReference[oaicite:8]{index=8}
var app = (0, express_1.default)();
var port = process.env.PORT || 3001;
// Middlewares globales
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Rutas
app.use('/api/products', productRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
// Middleware de manejo de errores (al final de todos)
app.use(errorHandler_1.errorHandler);
// Conectar a la base de datos y arrancar el servidor
(0, db_1.initDatabase)()
    .then(function () {
    app.listen(port, function () {
        console.log("Servidor ejecut\u00E1ndose en http://localhost:".concat(port));
    });
})
    .catch(function (err) {
    console.error('Error al conectar a la base de datos:', err);
});
