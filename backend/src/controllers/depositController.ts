import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';

const depositSchema = z.object({
  amount: z.number().int().positive('Сумма должна быть положительной'),
  reason: z.string().min(1, 'Укажите причину пополнения').max(500),
});

export async function deposit(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { studentId } = req.params;
    const staffId = req.user!.userId;
    const body = depositSchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { id: studentId, isActive: true },
    });

    if (!student) {
      throw new NotFoundError('Студент');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id: studentId },
        data: { coinBalance: { increment: body.amount } },
      });

      await tx.coinTransaction.create({
        data: {
          studentId,
          staffId,
          type: 'deposit',
          amount: body.amount,
          quantity: 1,
          comment: body.reason,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: staffId,
          action: 'deposit',
          resourceType: 'student',
          resourceId: studentId,
          metadata: JSON.stringify({ amount: body.amount, reason: body.reason }),
        },
      });

      return { newBalance: updated.coinBalance };
    }, { timeout: 10000 });

    res.status(201).json({
      success: true,
      data: {
        newBalance: result.newBalance,
        message: `Баланс пополнен на ${body.amount} коинов. Причина: ${body.reason}`,
      },
    });
  } catch (err) {
    next(err);
  }
}
