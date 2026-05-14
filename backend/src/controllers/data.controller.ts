import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getYearData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const year = parseInt(req.params.year as string, 10);
    if (isNaN(year)) return res.status(400).json({ error: 'Invalid year' });

    const record = await prisma.yearData.findUnique({
      where: { userId_year: { userId: req.user!.userId, year } }
    });

    if (!record) {
      return res.status(200).json({ data: {}, settings: {} });
    }

    res.status(200).json({ data: record.data, settings: record.settings });
  } catch (error) {
    next(error);
  }
};

export const saveYearData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const year = parseInt(req.params.year as string, 10);
    if (isNaN(year)) return res.status(400).json({ error: 'Invalid year' });

    const { data, settings } = req.body;

    const record = await prisma.yearData.upsert({
      where: { userId_year: { userId: req.user!.userId, year } },
      update: { data, settings },
      create: { userId: req.user!.userId, year, data, settings }
    });

    res.status(200).json({ success: true, data: record.data, settings: record.settings });
  } catch (error) {
    next(error);
  }
};

export const listYears = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const records = await prisma.yearData.findMany({
      where: { userId: req.user!.userId },
      select: { year: true },
      orderBy: { year: 'desc' }
    });

    res.status(200).json({ years: records.map(r => r.year) });
  } catch (error) {
    next(error);
  }
};
