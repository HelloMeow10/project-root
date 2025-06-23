import { Router } from 'express';
import { getAllRoles, createRol, updateRol, deleteRol } from '../controllers/RoleController';
// import authMiddleware from '../middlewares/authMiddleware'; // Descomentar y usar si es necesario
// import adminOnly from '../middlewares/adminOnly';       // Descomentar y usar si es necesario

const router = Router();

// Aplica middlewares como authMiddleware y adminOnly aquí según tus necesidades de seguridad
router.get('/', getAllRoles);
router.post('/', createRol);       // Podrías proteger con adminOnly
router.put('/:id_rol', updateRol); // Podrías proteger con adminOnly
router.delete('/:id_rol', deleteRol); // Podrías proteger con adminOnly

export default router;