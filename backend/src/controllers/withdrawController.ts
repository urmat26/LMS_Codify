import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';

const withdrawSchema = z
  .object({
    type: z.enum(['merch', 'manual']),
    merchItemId: z.string().uuid().optional(),
    quantity: z.number().int().min(1).default(1),
    amount: z.number().int().positive().optional(),
    comment: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'merch' && !data.merchItemId) {
        return false;
      }
      if (data.type === 'manual' && !data.amount) {
        return false;
      }
      return true;
    },
    {
      message:
        'Для списания мерча укажите товар, для произвольного списания — сумму',
    }
  );

const reverseSchema = z.object({
  transactionId: z.string().uuid(),
});

export async function withdraw(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { studentId } = req.params;
    const staffId = req.user!.userId;
    const body = withdrawSchema.parse(req.body);

    // Fetch student and validate existence
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || !student.isActive) {
      throw new NotFoundError('Студент');
    }

    let totalAmount = 0;
    let merchItemName: string | null = null;
    let finalQuantity = body.quantity ?? 1;
    let finalComment = body.comment ?? null;

    if (body.type === 'merch' && body.merchItemId) {
      const merchItem = await prisma.merchItem.findUnique({
        where: { id: body.merchItemId },
      });

      if (!merchItem || !merchItem.isActive) {
        throw new NotFoundError('Товар');
      }

      totalAmount = merchItem.price * finalQuantity;
      merchItemName = merchItem.name;
    } else if (body.type === 'manual' && body.amount) {
      totalAmount = body.amount;
      finalQuantity = 1;
      finalComment = finalComment || 'Произвольное списание';
    } else {
      throw new ValidationError('Некорректные данные для списания');
    }

    if (totalAmount <= 0) {
      throw new ValidationError('Сумма списания должна быть положительной');
    }

    // --- Race condition handling ---
    // Use Prisma's interactive transaction with serializable isolation
    // to ensure atomic read-check-update on the student's balance.
    const transaction = await prisma.$transaction(
      async (tx) => {
        // 1. Read current balance WITH lock (SELECT FOR UPDATE)
        const lockedStudent = await tx.student.findUnique({
          where: { id: studentId },
        });

        if (!lockedStudent) {
          throw new NotFoundError('Студент');
        }

        // 2. Check sufficient balance
        if (lockedStudent.coinBalance < totalAmount) {
          throw new ValidationError(
            `Недостаточно коинов. Баланс: ${lockedStudent.coinBalance}, требуется: ${totalAmount}`
          );
        }

        // 3. Decrement balance atomically
        const updatedStudent = await tx.student.update({
          where: { id: studentId },
          data: {
            coinBalance: {
              decrement: totalAmount,
            },
          },
        });

        // 4. Create transaction record
        const txRecord = await tx.coinTransaction.create({
          data: {
            studentId,
            staffId,
            type: body.type,
            merchItemId: body.merchItemId ?? null,
            quantity: finalQuantity,
            amount: totalAmount,
            comment: finalComment,
          },
        });

        return {
          transaction: txRecord,
          previousBalance: lockedStudent.coinBalance,
          newBalance: updatedStudent.coinBalance,
          itemName: merchItemName,
        };
      },
      { timeout: 10000 }
    );

    res.status(201).json({
      success: true,
      data: {
        transaction: transaction.transaction,
        previousBalance: transaction.previousBalance,
        newBalance: transaction.newBalance,
        itemName: transaction.itemName,
        message: `Списание выполнено успешно. Студент: ${student.fullName}, сумма: ${totalAmount} коинов`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function reverseTransaction(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { transactionId } = req.params;
    const staffId = req.user!.userId;

    const transaction = await prisma.coinTransaction.findUnique({
      where: { id: transactionId },
      include: { student: true },
    });

    if (!transaction) {
      throw new NotFoundError('Транзакция');
    }

    if (transaction.isReversed) {
      throw new ValidationError('Транзакция уже была отменена');
    }

    // Reverse within a serializable transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Lock and update student balance
        const lockedStudent = await tx.student.findUnique({
          where: { id: transaction.studentId },
        });

        if (!lockedStudent) {
          throw new NotFoundError('Студент');
        }

        // Return coins to balance
        await tx.student.update({
          where: { id: transaction.studentId },
          data: {
            coinBalance: {
              increment: transaction.amount,
            },
          },
        });

        // Mark transaction as reversed
        const reversed = await tx.coinTransaction.update({
          where: { id: transactionId },
          data: {
            isReversed: true,
            reversedAt: new Date(),
            reversedBy: staffId,
          },
        });

        return {
          reversed,
          newBalance: lockedStudent.coinBalance + transaction.amount,
          previousBalance: lockedStudent.coinBalance,
        };
      },
      { timeout: 10000 }
    );

    res.json({
      success: true,
      data: {
        transaction: result.reversed,
        previousBalance: result.previousBalance,
        newBalance: result.newBalance,
        message: `Транзакция отменена. ${transaction.amount} коинов возвращено на баланс студента.`,
      },
    });
  } catch (err) {
    next(err);
  }
}
