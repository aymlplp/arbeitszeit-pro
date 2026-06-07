import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { generateTokens } from '../utils/token.utils';
import { 
  sendWelcomeEmail, 
  sendVerificationEmail, 
  sendPasswordResetEmail,
  sendSupportEmail
} from '../utils/email.utils';

// Stateful session configuration with production cross-domain support
const PROD = process.env.NODE_ENV === 'production';

// ── Helpers ──────────────────────────────────────────────────────────────────
import { AuthRequest } from '../middlewares/auth.middleware';

function gen6DigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function formatUser(u: any) {
  return { 
    id: u.id, 
    email: u.email, 
    name: u.name, 
    role: u.role, 
    plan: u.plan,
    employerCode: u.employerCode,
    employerId: u.employerId
  };
}

async function issueSession(res: Response, userId: string) {
  const { accessToken, refreshToken, jti } = generateTokens(userId);

  // Persist the unique session key to database, invalidating previous tokens
  await prisma.user.update({
    where: { id: userId },
    data:  { refreshTokenId: jti },
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   PROD,
    sameSite: PROD ? 'none' : 'strict', // 'none' allows cross-domain Vercel ↔ API connection
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });

  return accessToken;
}

// ── REGISTER ─────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, plan, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);

    let employerCode = null;
    const resolvedRole = (role === 'EMPLOYER') ? 'EMPLOYER' : 'USER';
    if (resolvedRole === 'EMPLOYER') {
      employerCode = 'EMP-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      // Ensure unique code
      let isUnique = false;
      while (!isUnique) {
        const check = await prisma.user.findUnique({ where: { employerCode } });
        if (!check) {
          isUnique = true;
        } else {
          employerCode = 'EMP-' + crypto.randomBytes(3).toString('hex').toUpperCase();
        }
      }
    }

    const user = await prisma.user.create({
      data: { 
        email, 
        name, 
        passwordHash, 
        verificationCode: null, 
        verificationCodeExpiry: null,
        emailVerified: true,
        role: resolvedRole,
        employerCode,
        plan: (plan?.toUpperCase() === 'PRO') ? 'PRO' : 'FREE'
      },
    });

    const accessToken = await issueSession(res, user.id);
    res.status(201).json({ success: true, user: formatUser(user), accessToken });
  } catch (err) {
    next(err);
  }
};

// ── VERIFY EMAIL ─────────────────────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, code } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.emailVerified) {
      const accessToken = await issueSession(res, user.id);
      return res.status(200).json({ success: true, user: formatUser(user), accessToken });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (!user.verificationCodeExpiry || user.verificationCodeExpiry < new Date()) {
      return res.status(400).json({ error: 'Code expired — request a new one' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data:  { emailVerified: true, verificationCode: null, verificationCodeExpiry: null },
    });

    sendWelcomeEmail(updated.email, updated.name).catch(() => null);

    const accessToken = await issueSession(res, updated.id);
    res.status(200).json({ success: true, user: formatUser(updated), accessToken });
  } catch (err) {
    next(err);
  }
};

// ── RESEND CODE ──────────────────────────────────────────────────────────────
export const resendCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)              return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' });

    const code   = gen6DigitCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({ 
      where: { id: userId }, 
      data: { verificationCode: code, verificationCodeExpiry: expiry } 
    });
    
    sendVerificationEmail(user.email, user.name, code).catch(() => null);

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ── LOGIN ────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    let user = null;
    if (email.includes('@')) {
      user = await prisma.user.findFirst({
        where: {
          email: {
            equals: email.trim(),
            mode: 'insensitive'
          }
        }
      });
    } else {
      user = await prisma.user.findFirst({
        where: {
          name: {
            equals: email.trim(),
            mode: 'insensitive'
          }
        }
      });
    }
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verificationCode: null, verificationCodeExpiry: null }
      });
      user.emailVerified = true;
    }

    const accessToken = await issueSession(res, user.id);
    res.status(200).json({ success: true, user: formatUser(user), accessToken });
  } catch (err) {
    next(err);
  }
};

// ── LOGOUT ───────────────────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (token) {
      const payload = jwt.decode(token) as { userId?: string } | null;
      if (payload?.userId) {
        // Clear tracking session completely from the database upon logout
        await prisma.user.update({
          where: { id: payload.userId },
          data:  { refreshTokenId: null },
        }).catch(() => null);
      }
    }
  } catch {}

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   PROD,
    sameSite: PROD ? 'none' : 'strict',
  });
  res.status(200).json({ success: true });
};

// ── REFRESH TOKEN ────────────────────────────────────────────────────────────
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) return res.status(401).json({ code: 'TOKEN_EXPIRED', message: 'No refresh token' });

    let decoded: { userId: string; jti: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as any;
    } catch {
      return res.status(401).json({ code: 'TOKEN_EXPIRED', message: 'Invalid refresh token' });
    }

    // ── Stateful Enforcement: Verify the token jti matches database tracking ──
    const user = await prisma.user.findUnique({
      where:  { id: decoded.userId },
      select: { id: true, refreshTokenId: true },
    });

    if (!user || user.refreshTokenId !== decoded.jti) {
      // Possible session compromise/replay: wipe all session states as precaution
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { refreshTokenId: null } }).catch(() => null);
      }
      res.clearCookie('refreshToken', { httpOnly: true, secure: PROD, sameSite: PROD ? 'none' : 'strict' });
      return res.status(401).json({ code: 'TOKEN_EXPIRED', message: 'Session expired — please log in again' });
    }

    // Successful verification: Rotate session token and persist updated jti
    const accessToken = await issueSession(res, decoded.userId);
    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
};

// ── ME ───────────────────────────────────────────────────────────────────────
export const me = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

// ── FORGOT PASSWORD ──────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const GENERIC = { success: true, message: 'If this email exists, a reset link was sent.' };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(200).json(GENERIC);

    const token  = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExpiry: expiry } });
    sendPasswordResetEmail(user.email, user.name, token).catch(() => null);

    res.status(200).json(GENERIC);
  } catch (err) {
    next(err);
  }
};

// ── RESET PASSWORD ───────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset link.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash, resetToken: null, resetTokenExpiry: null, refreshTokenId: null },
    });

    res.status(200).json({ success: true, message: 'Password updated. Please log in again.' });
  } catch (err) {
    next(err);
  }
};

// ── CHANGE PASSWORD ─────────────────────────────────────────────────────────
export const changePassword = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash, refreshTokenId: null },
    });

    res.status(200).json({ success: true, message: 'Password changed. Please log in again.' });
  } catch (err) {
    next(err);
  }
};

// ── CUSTOMER SUPPORT EMAIL ───────────────────────────────────────────────────
export const support = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, Email and Message are required fields.' });
    }

    await sendSupportEmail(name, email, phone || 'Not provided', message);

    res.status(200).json({ success: true, message: 'Your support request has been sent successfully.' });
  } catch (err) {
    next(err);
  }
};

// ── LINK/UNLINK EMPLOYER ──────────────────────────────────────────────────────
export const linkEmployer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Employer code is required' });
    }

    const employer = await prisma.user.findUnique({
      where: { employerCode: code.trim().toUpperCase() }
    });

    if (!employer || employer.role !== 'EMPLOYER') {
      return res.status(404).json({ error: 'No employer found with this code' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { employerId: employer.id }
    });

    res.status(200).json({ 
      success: true, 
      message: `Successfully linked to employer: ${employer.name || employer.email}`,
      user: formatUser(updatedUser)
    });
  } catch (err) {
    next(err);
  }
};

export const unlinkEmployer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { employerId: null }
    });

    res.status(200).json({ 
      success: true, 
      message: 'Successfully unlinked from employer',
      user: formatUser(updatedUser)
    });
  } catch (err) {
    next(err);
  }
};
