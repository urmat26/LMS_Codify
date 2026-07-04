import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { NotFoundError } from '../utils/errors';

export async function getMyProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          select: { id: true, coinBalance: true, groupId: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Пользователь');
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        student: user.student
          ? {
              id: user.student.id,
              coinBalance: user.student.coinBalance,
              groupId: user.student.groupId,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyTransactions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const studentId = req.user!.studentId;

    if (!studentId) {
      throw new NotFoundError('Студент');
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundError('Студент');
    }

    const transactions = await prisma.coinTransaction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        staff: { select: { id: true, fullName: true } },
        merchItem: { select: { id: true, name: true, price: true } },
      },
    });

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          fullName: student.fullName,
          coinBalance: student.coinBalance,
        },
        transactions,
      },
    });
  } catch (err) {
    next(err);
  }
}
