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
const express_1 = require("express");
const orderController = __importStar(require("../controllers/OrderController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Ruta para que un cliente obtenga sus propios pedidos
router.get('/my-orders', authMiddleware_1.authMiddleware, orderController.getMyOrders);
// Rutas existentes (CRUD general de pedidos, la de abajo es más para admin)
router.get('/', authMiddleware_1.authMiddleware, orderController.getAllOrders); // Podría ser solo para admin
router.get('/:id', authMiddleware_1.authMiddleware, orderController.getOrderById);
router.post('/', authMiddleware_1.authMiddleware, orderController.createOrder); // Este es el endpoint de "checkout"
router.put('/:id', authMiddleware_1.authMiddleware, orderController.updateOrder); // Para admin actualizar estado, etc.
router.delete('/:id', authMiddleware_1.authMiddleware, orderController.deleteOrder); // Para admin
exports.default = router;
