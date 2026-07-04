import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

export async function getTodayStats(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [studentCount, coinAgg] = await Promise.all([
      prisma.coinTransaction.groupBy({
        by: ['studentId'],
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          isReversed: false,
        },
        _count: true,
      }),
      prisma.coinTransaction.aggregate({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          isReversed: false,
        },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        studentsServedToday: studentCount.length,
        coinsSpentToday: coinAgg._sum.amount || 0,
        totalTransactions: studentCount.reduce((sum, g) => sum + g._count, 0),
      },
    });
  } catch (err) {
    next(err);
  }
}
