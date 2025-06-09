"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const authRoutes_ts_1 = __importDefault(require("./routes/authRoutes.ts"));
const errorHandler_1 = require("./middlewares/errorHandler");
dotenv_1.default.config(); // Carga variables de entorno desde .env:contentReference[oaicite:8]{index=8}
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middlewares globales
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Rutas
app.use('/api/products', productRoutes_1.default);
app.use('/api/auth', authRoutes_ts_1.default);
// Middleware de manejo de errores (al final de todos)
app.use(errorHandler_1.errorHandler);
// Conectar a la base de datos y arrancar el servidor
(0, db_1.initDatabase)()
    .then(() => {
    app.listen(port, () => {
        console.log(`Servidor ejecutándose en http://localhost:${port}`);
    });
})
    .catch((err) => {
    console.error('Error al conectar a la base de datos:', err);
});
