import { Router } from 'express';
import { getAllUsuariosInternos, getAllClientes, createUsuarioInterno, toggleActivoUsuarioInterno, eliminarUsuarioInterno, obtenerUsuarioInternoPorId, editarUsuarioInterno } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminOnly } from '../middlewares/adminOnly';

const router = Router();

router.get('/internos', authMiddleware, adminOnly, getAllUsuariosInternos);
router.get('/clientes', authMiddleware, adminOnly, getAllClientes);
router.post('/internos', authMiddleware, adminOnly, createUsuarioInterno);
// PATCH para activar/desactivar usuario interno
router.patch('/internos/:id/activo', authMiddleware, adminOnly, toggleActivoUsuarioInterno);
// DELETE para eliminar usuario interno
router.delete('/internos/:id', authMiddleware, adminOnly, eliminarUsuarioInterno);
// Obtener usuario interno por ID
router.get('/internos/:id', authMiddleware, adminOnly, obtenerUsuarioInternoPorId);
// Editar usuario interno
router.put('/internos/:id', authMiddleware, adminOnly, editarUsuarioInterno);

export default router;