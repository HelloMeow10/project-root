import { Router } from 'express';
import { 
    getAllUsuariosInternos, 
    getAllClientes, 
    createUsuarioInterno, 
    toggleActivoUsuarioInterno, 
    eliminarUsuarioInterno, 
    obtenerUsuarioInternoPorId, 
    editarUsuarioInterno, 
    getAuthenticatedUserData,
    updateAuthenticatedClienteData // Importar la nueva función
} from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminOnly } from '../middlewares/adminOnly';

const router = Router();

// Rutas para Usuarios Internos (protegidas y solo para admins)
router.get('/internos', authMiddleware, adminOnly, getAllUsuariosInternos);
router.get('/clientes', authMiddleware, adminOnly, getAllClientes);
router.post('/internos', authMiddleware, adminOnly, createUsuarioInterno);
router.patch('/internos/:id/activo', authMiddleware, adminOnly, toggleActivoUsuarioInterno);
router.delete('/internos/:id', authMiddleware, adminOnly, eliminarUsuarioInterno);
router.get('/internos/:id', authMiddleware, adminOnly, obtenerUsuarioInternoPorId);
router.put('/internos/:id', authMiddleware, adminOnly, editarUsuarioInterno);

// Rutas para el Cliente autenticado
router.get('/me', authMiddleware, getAuthenticatedUserData);
router.put('/me', authMiddleware, updateAuthenticatedClienteData); // Nueva ruta para actualizar datos del cliente

export default router;