import { Router } from 'express';
import { 
    getAllUsuariosInternos, 
    getAllClientes, 
    createUsuarioInterno, 
    toggleActivoUsuarioInterno, 
    eliminarUsuarioInterno, 
    obtenerUsuarioInternoPorId, 
    editarUsuarioInterno,
    editarCliente,
    toggleActivoCliente,
    eliminarCliente
} from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminOnly } from '../middlewares/adminOnly';

const router = Router();

// Rutas para Usuarios Internos
router.get('/internos', authMiddleware, adminOnly, getAllUsuariosInternos);
router.post('/internos', authMiddleware, adminOnly, createUsuarioInterno);
router.get('/internos/:id', authMiddleware, adminOnly, obtenerUsuarioInternoPorId);
router.put('/internos/:id', authMiddleware, adminOnly, editarUsuarioInterno);
router.patch('/internos/:id/activo', authMiddleware, adminOnly, toggleActivoUsuarioInterno);
router.delete('/internos/:id', authMiddleware, adminOnly, eliminarUsuarioInterno);

// Rutas para Clientes
router.get('/clientes', authMiddleware, adminOnly, getAllClientes);
router.put('/clientes/:id', authMiddleware, adminOnly, editarCliente);
router.patch('/clientes/:id/activo', authMiddleware, adminOnly, toggleActivoCliente);
router.delete('/clientes/:id', authMiddleware, adminOnly, eliminarCliente);

export default router;