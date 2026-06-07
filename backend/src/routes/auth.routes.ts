import { Router } from 'express';
import { 
  register, login, logout, refresh, me,
  verifyEmail, resendCode, forgotPassword, resetPassword, changePassword,
  support, linkEmployer, unlinkEmployer
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../utils/validators';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, me);

// New smart merged authentication endpoints
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendCode);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticate, changePassword);
router.post('/support', support);

// Employer linking
router.post('/link-employer', authenticate, linkEmployer);
router.post('/unlink-employer', authenticate, unlinkEmployer);

export default router;
