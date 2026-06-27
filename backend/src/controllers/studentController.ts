import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { NotFoundError } from '../utils/errors';

export async function getGroupStudents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { groupId } = req.params;
    const { search, includeInactive } = req.query;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundError('Группа');
    }

    const whereClause: any = {
      groupId,
      ...(includeInactive !== 'true' ? { isActive: true } : {}),
      ...(search
        ? {
            fullName: {
              contains: search as string,
            },
          }
        : {}),
    };

    const students = await prisma.student.findMany({
      where: whereClause,
      orderBy: { fullName: 'asc' },
      include: {
        transactions: {
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
            isReversed: false,
          },
          select: { id: true, amount: true, type: true, createdAt: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const result = students.map((student) => ({
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      coinBalance: student.coinBalance,
      receivedMerchToday: student.transactions.length > 0,
      todayTransactions: student.transactions,
    }));

    res.json({
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          course: group.course,
        },
        students: result,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudentTransactions(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundError('Студент');
    }

    const transactions = await prisma.coinTransaction.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
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
