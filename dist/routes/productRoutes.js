"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/productRoutes.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Endpoint para obtener todos los paquetes turísticos
router.get('/paquetes', async (req, res) => {
    try {
        const paquetes = await prisma.producto.findMany({
            where: {
                tipo: { nombre: 'paquete' },
                activo: true
            },
            include: {
                paqueteDetallesAsPaquete: {
                    include: {
                        producto: {
                            include: {
                                hospedaje: true,
                                pasaje: true
                            }
                        }
                    }
                }
            }
        });
        res.json(paquetes);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener paquetes' });
    }
});
// Endpoint para obtener solo los vuelos
router.get('/vuelos', async (req, res) => {
    try {
        // id_tipo = 2 para vuelos (ajusta si tu id_tipo de vuelos es diferente)
        const vuelos = await prisma.producto.findMany({
            where: { id_tipo: 2, activo: true },
            include: { pasaje: true }
        });
        res.json(vuelos);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener vuelos' });
    }
});
// Endpoint para obtener solo los hoteles
router.get('/hoteles', async (req, res) => {
    try {
        // id_tipo = 3 para hoteles
        const hoteles = await prisma.producto.findMany({
            where: { id_tipo: 3, activo: true },
            include: { hospedaje: true }
        });
        res.json(hoteles);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener hoteles' });
    }
});
router.post('/pedidos', async (req, res) => {
    var _a;
    try {
        const { items } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id_cliente; // Ajusta según tu auth
        if (!userId)
            return res.status(401).json({ message: 'No autenticado' });
        // Calcula el total sumando los precios de los productos
        let total = 0;
        for (const item of items) {
            const producto = await prisma.producto.findUnique({ where: { id_producto: item.id_producto } });
            if (!producto)
                return res.status(400).json({ message: 'Producto no encontrado' });
            total += Number(producto.precio) * item.cantidad;
        }
        // Crea el pedido
        const pedido = await prisma.pedido.create({
            data: {
                id_cliente: userId,
                estado: 'pendiente',
                total,
                items: {
                    create: items.map((item) => ({
                        id_producto: item.id_producto,
                        cantidad: item.cantidad,
                        precio: undefined // Se setea abajo
                    }))
                }
            },
            include: { items: true }
        });
        // Actualiza el precio de cada item (por si el precio cambia)
        for (const item of pedido.items) {
            const producto = await prisma.producto.findUnique({ where: { id_producto: item.id_producto } });
            await prisma.pedidoItem.update({
                where: { id_detalle: item.id_detalle },
                data: { precio: (producto === null || producto === void 0 ? void 0 : producto.precio) || 0 }
            });
        }
        res.json({ id: pedido.id_pedido, items: pedido.items });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al crear el pedido' });
    }
});
exports.default = router;
