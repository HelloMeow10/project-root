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
exports.default = router;
