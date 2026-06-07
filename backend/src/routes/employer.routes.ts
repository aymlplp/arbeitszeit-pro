import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { 
  getEmployerWorkers, 
  getWorkerYears, 
  getWorkerYearData 
} from '../controllers/employer.controller';

const router = Router();

router.use(authenticate); // Protect all routes

router.get('/workers', getEmployerWorkers);
router.get('/workers/:workerId/years', getWorkerYears);
router.get('/workers/:workerId/year/:year', getWorkerYearData);

export default router;
