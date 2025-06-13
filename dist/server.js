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
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config(); // Carga variables de entorno desde .env:contentReference[oaicite:8]{index=8}
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middlewares globales
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Servir archivos estáticos de la carpeta css
app.use('/css', express_1.default.static(path_1.default.join(__dirname, '../css')));
// Servir archivos estáticos de la carpeta html
app.use(express_1.default.static(path_1.default.join(__dirname, '../html')));
// Servir archivos estáticos de la carpeta js
app.use('/js', express_1.default.static(path_1.default.join(__dirname, '../js')));
// Rutas
app.use('/api/products', productRoutes_1.default);
// Si quieres que funcione también en /api/pedidos:
app.use('/api', productRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/cart', cartRoutes_1.default);
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../html/inicio.html'));
});
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
