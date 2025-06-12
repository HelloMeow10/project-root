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
exports.default = router;
