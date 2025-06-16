// src/server.ts
import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDatabase } from './config/db';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import cartRoutes from './routes/cartRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { errorHandler } from './middlewares/errorHandler';
import path from 'path';

dotenv.config(); // Carga variables de entorno desde .env:contentReference[oaicite:8]{index=8}

const app: Application = express();
const port = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Servir archivos estáticos de la carpeta css
app.use('/css', express.static(path.join(__dirname, '../css')));
// Servir archivos estáticos de la carpeta html
app.use(express.static(path.join(__dirname, '../html')));
// Servir archivos estáticos de la carpeta js
app.use('/js', express.static(path.join(__dirname, '../js')));

app.use('/imagenes', express.static(path.join(__dirname, '../imagenes')));

// Rutas
app.use('/api/products', productRoutes);
// Si quieres que funcione también en /api/pedidos:
app.use('/api', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../html/inicio.html'));
});

// Middleware de manejo de errores (al final de todos)
app.use(errorHandler);

// Conectar a la base de datos y arrancar el servidor
initDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor ejecutándose en http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error al conectar a la base de datos:', err);
  });
