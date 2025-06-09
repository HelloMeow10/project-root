// src/server.ts
import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDatabase } from './config/db';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes.ts';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config(); // Carga variables de entorno desde .env:contentReference[oaicite:8]{index=8}

const app: Application = express();
const port = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rutas
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

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
