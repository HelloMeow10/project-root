import { Router } from 'express';
import { getAllUsuariosInternos, getAllClientes } from '../controllers/UserController';

const router = Router();

router.get('/internos', getAllUsuariosInternos);
router.get('/clientes', getAllClientes);

export default router;