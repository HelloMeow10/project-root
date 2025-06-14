import { Router } from 'express';
import { getAllUsuariosInternos, getAllClientes, createUsuarioInterno } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminOnly } from '../middlewares/adminOnly';

const router = Router();

router.get('/internos', authMiddleware, adminOnly, getAllUsuariosInternos);
router.get('/clientes', authMiddleware, adminOnly, getAllClientes);
router.post('/internos', authMiddleware, adminOnly, createUsuarioInterno);

export default router;