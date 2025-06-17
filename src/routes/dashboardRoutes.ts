import { Router } from 'express';
import { getDashboardStats, getSalesByMonth, getRecentActivity } from '../controllers/DashboardController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { adminOnly } from '../middlewares/adminOnly';

const router = Router();

router.get('/stats', authMiddleware, adminOnly, getDashboardStats);
router.get('/sales-by-month', authMiddleware, adminOnly, getSalesByMonth);
router.get('/recent-activity', authMiddleware, adminOnly, getRecentActivity);

export default router;