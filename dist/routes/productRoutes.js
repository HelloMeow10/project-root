"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/productRoutes.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const ProductController_1 = require("../controllers/ProductController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminOnly_1 = require("../middlewares/adminOnly");
const ProductController = __importStar(require("../controllers/ProductController"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Extensión del tipo Request para incluir `user`
// Endpoint para obtener todos los paquetes turísticos
router.get('/paquetes', async (req, res) => {
    try {
        const tipoPaquete = await prisma.tipoProducto.findUnique({
            where: { nombre: 'paquete' },
        });
        if (!tipoPaquete) {
            console.error("TipoProducto 'paquete' not found in database.");
            return res.status(404).json({ message: "Tipo de producto 'paquete' no configurado." });
        }
        const paqueteTipoId = tipoPaquete.id_tipo;
        const paquetes = await prisma.producto.findMany({
            where: { id_tipo: paqueteTipoId, activo: true }, // Use the fetched ID
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
        console.error('Error al obtener paquetes:', err);
        res.status(500).json({ message: 'Error al obtener paquetes', error: err.message });
    }
});
// Endpoint para obtener solo los vuelos (CORREGIDO)
router.get('/vuelos', async (req, res) => {
    try {
        const tipoVuelo = await prisma.tipoProducto.findUnique({
            where: { nombre: 'vuelo' },
        });
        if (!tipoVuelo) {
            return res.status(404).json({ message: "Tipo de producto 'vuelo' no configurado." });
        }
        const vuelos = await prisma.producto.findMany({
            where: { id_tipo: tipoVuelo.id_tipo, activo: true },
            include: {
                pasaje: {
                    include: {
                        tipoAsiento: true
                    }
                }
            }
        });
        res.json(vuelos);
    }
    catch (err) {
        console.error('Error al obtener vuelos:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        res.status(500).json({ message: 'Error al obtener vuelos', error: errorMessage });
    }
});
// Endpoint para obtener solo los hoteles
router.get('/hoteles', async (req, res) => {
    const hoteles = await prisma.producto.findMany({
        where: { id_tipo: 3, activo: true },
        include: { hospedaje: true }
    });
    res.json(hoteles);
});
// Endpoint para crear pedidos
router.post('/pedidos', authMiddleware_1.authMiddleware, async (req, res) => {
    var _a;
    try {
        const { items } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'No autenticado' });
        }
        // Validar productos y calcular total
        let subtotal = 0;
        const itemsToCreate = [];
        for (const item of items) {
            const producto = await prisma.producto.findUnique({
                where: { id_producto: item.id_producto }
            });
            if (!producto) {
                return res.status(400).json({ message: `Producto no encontrado: ${item.id_producto}` });
            }
            subtotal += Number(producto.precio) * item.cantidad;
            itemsToCreate.push({
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio: Number(producto.precio)
            });
        }
        // Sumar IVA (21%)
        const iva = subtotal * 0.21;
        const total = subtotal + iva;
        // Crear el pedido
        const pedido = await prisma.pedido.create({
            data: {
                id_cliente: userId,
                estado: 'pendiente',
                total,
                items: {
                    create: itemsToCreate
                }
            },
            include: { items: true }
        });
        res.json({ id: pedido.id_pedido, items: pedido.items, total: pedido.total });
    }
    catch (err) {
        console.error('Error al crear el pedido:', err);
        res.status(500).json({ message: 'Error al crear el pedido', error: err.message });
    }
});
// Endpoint para eliminar productos
router.delete('/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, ProductController_1.deleteProduct);
// Endpoint para obtener solo los autos
router.get('/autos', async (req, res) => {
    try {
        const tipoAuto = await prisma.tipoProducto.findFirst({
            where: { nombre: { contains: 'auto', mode: 'insensitive' } }
        });
        if (!tipoAuto)
            return res.json([]);
        const autos = await prisma.producto.findMany({
            where: {
                id_tipo: tipoAuto.id_tipo,
                activo: true,
                stock: { gt: 0 }
            },
            include: {
                alquiler: true
            }
        });
        res.json(autos);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener autos' });
    }
});
router.get('/individuals', 
// authMiddleware, // Consider if auth is needed for just listing individuals for an admin
ProductController.getIndividualProducts // New controller method
);
// Endpoint para obtener todos los productos
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', ProductController.createProduct); // <-- ESTA LÍNEA ES CLAVE
router.put('/:id', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);
router.post('/paquetes/:id_paquete/details', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, ProductController.agregarComponenteAPaquete // New controller method
);
router.delete('/paquetes/:id_paquete/details/:id_producto_componente', authMiddleware_1.authMiddleware, adminOnly_1.adminOnly, ProductController.eliminarComponenteDePaquete // New controller method
);
exports.default = router;
