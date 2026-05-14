import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { createCheckoutSession, createPortalSession } from '../controllers/stripe.controller';

const router = Router();

router.use(authenticate);

router.post('/checkout', createCheckoutSession);
router.post('/portal', createPortalSession);

export default router;
