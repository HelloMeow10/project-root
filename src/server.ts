// src/server.ts
import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';
import { initDatabase } from './config/db';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import cartRoutes from './routes/cartRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { errorHandler } from './middlewares/errorHandler';
import path from 'path';
import dashboardRoutes from './routes/dashboardRoutes';
import direccionFacturacionRoutes from './routes/direccionFacturacionRoutes'; // <-- Nueva importación
// ... otras importaciones
import roleRoutes from './routes/roleRoutes'; // Ajusta la ruta


const app: Application = express();
const port = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/roles', roleRoutes); // Añade esta línea
// Servir archivos estáticos de la carpeta css
app.use('/css', express.static(path.join(__dirname, '../css')));
// Servir archivos estáticos de la carpeta html
app.use(express.static(path.join(__dirname, '../html')));
// Servir archivos estáticos de la carpeta js
app.use('/js', express.static(path.join(__dirname, '../js')));

app.use('/imagenes', express.static(path.join(__dirname, '../imagenes')));

// Rutas
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/direcciones-facturacion', direccionFacturacionRoutes); // <-- Nueva ruta

// Servir verificar-email.html para /verificar-email (con o sin query params)
app.get('/verificar-email', (req, res) => {
  res.sendFile(path.join(__dirname, '../html/verificar-email.html'));
});

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
