import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { getYearData, saveYearData, listYears } from '../controllers/data.controller';

const router = Router();

router.use(authenticate); // Protect all routes

router.get('/', listYears);
router.get('/:year', getYearData);
router.post('/:year', saveYearData);

export default router;
