"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/productRoutes.ts
var express_1 = require("express");
var ProductController_1 = require("../controllers/ProductController");
var authMiddleware_1 = require("../middlewares/authMiddleware");
var router = (0, express_1.Router)();
// Rutas públicas (ejemplo: cualquiera puede ver productos)
router.get('/', ProductController_1.getAllProducts);
router.get('/:id', ProductController_1.getProductById);
// Rutas protegidas por JWT (solo usuarios autenticados pueden crear, actualizar, eliminar)
router.post('/', authMiddleware_1.authMiddleware, ProductController_1.createProduct);
router.put('/:id', authMiddleware_1.authMiddleware, ProductController_1.updateProduct);
router.delete('/:id', authMiddleware_1.authMiddleware, ProductController_1.deleteProduct);
exports.default = router;
