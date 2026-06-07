import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

// ── GET EMPLOYER WORKERS ─────────────────────────────────────────────────────
export const getEmployerWorkers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employerId = req.user!.userId;

    const workers = await prisma.user.findMany({
      where: { employerId },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    res.status(200).json({ success: true, workers });
  } catch (err) {
    next(err);
  }
};

// ── GET WORKER YEARS ─────────────────────────────────────────────────────────
export const getWorkerYears = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employerId = req.user!.userId;
    const workerId = req.params.workerId as string;

    // Verify ownership
    const worker = await prisma.user.findFirst({
      where: { id: workerId, employerId }
    });
    if (!worker) {
      return res.status(403).json({ error: 'Access denied: Worker is not linked to you' });
    }

    const records = await prisma.yearData.findMany({
      where: { userId: workerId },
      select: { year: true },
      orderBy: { year: 'desc' }
    });

    res.status(200).json({ success: true, years: records.map(r => r.year) });
  } catch (err) {
    next(err);
  }
};

// ── GET WORKER YEAR DATA ─────────────────────────────────────────────────────
export const getWorkerYearData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employerId = req.user!.userId;
    const workerId = req.params.workerId as string;
    const year = parseInt(req.params.year as string, 10);

    if (isNaN(year)) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    // Verify ownership
    const worker = await prisma.user.findFirst({
      where: { id: workerId, employerId }
    });
    if (!worker) {
      return res.status(403).json({ error: 'Access denied: Worker is not linked to you' });
    }

    const record = await prisma.yearData.findUnique({
      where: { userId_year: { userId: workerId, year } }
    });

    if (!record) {
      return res.status(200).json({ data: {}, settings: {} });
    }

    res.status(200).json({ data: record.data, settings: record.settings });
  } catch (err) {
    next(err);
  }
};
