import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { NotFoundError, ValidationError, InsufficientBalanceError } from '../utils/errors';

const cartItemSchema = z.object({
  merchItemId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const withdrawSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('merch'),
    items: z.array(cartItemSchema).min(1, 'Добавьте хотя бы один товар'),
    comment: z.string().max(500).optional(),
  }),
  z.object({
    type: z.literal('manual'),
    amount: z.number().int().positive('Сумма должна быть положительной'),
    comment: z.string().max(500).optional(),
  }),
]);

export async function withdraw(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { studentId } = req.params;
    const staffId = req.user!.userId;
    const body = withdrawSchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || !student.isActive) {
      throw new NotFoundError('Студент');
    }

    let totalAmount = 0;
    let itemNames: string[] = [];
    let cartResolved: { merchItemId: string; quantity: number; price: number }[] = [];
    let finalComment = body.comment ?? null;

    if (body.type === 'merch') {
      const ids = body.items.map((i) => i.merchItemId);
      const merchItems = await prisma.merchItem.findMany({
        where: { id: { in: ids }, isActive: true },
      });

      if (merchItems.length !== ids.length) {
        throw new NotFoundError('Один или несколько товаров не найдены');
      }

      // Deduplicate: merge same-item entries
      const merged = new Map<string, number>();
      for (const item of body.items) {
        merged.set(item.merchItemId, (merged.get(item.merchItemId) || 0) + item.quantity);
      }

      const merchMap = new Map(merchItems.map((m) => [m.id, m]));
      for (const [merchItemId, quantity] of merged) {
        const merch = merchMap.get(merchItemId);
        if (!merch) {
          throw new NotFoundError(`Товар ${merchItemId}`);
        }
        const cost = merch.price * quantity;
        totalAmount += cost;
        itemNames.push(`${merch.name} ×${quantity}`);
        cartResolved.push({ merchItemId, quantity, price: merch.price });
      }
    } else {
      totalAmount = body.amount;
      finalComment = finalComment || 'Произвольное списание';
    }

    if (totalAmount <= 0) {
      throw new ValidationError('Сумма списания должна быть положительной');
    }

    // Atomic transaction: validate balance, decrement, create records
    const result = await prisma.$transaction(
      async (tx) => {
        const lockedStudent = await tx.student.findUnique({
          where: { id: studentId },
        });

        if (!lockedStudent) {
          throw new NotFoundError('Студент');
        }

        if (lockedStudent.coinBalance < totalAmount) {
          throw new InsufficientBalanceError(lockedStudent.coinBalance, totalAmount);
        }

        const updatedStudent = await tx.student.update({
          where: { id: studentId },
          data: {
            coinBalance: {
              decrement: totalAmount,
            },
          },
        });

        // Create one transaction record per cart item (or one for manual)
        if (body.type === 'merch') {
          const created = await Promise.all(
            cartResolved.map((item) =>
              tx.coinTransaction.create({
                data: {
                  studentId,
                  staffId,
                  type: 'merch',
                  merchItemId: item.merchItemId,
                  quantity: item.quantity,
                  amount: item.price * item.quantity,
                  comment: body.comment || null,
                },
                select: { id: true, amount: true },
              })
            )
          );

          return {
            transactionIds: created.map((t) => t.id),
            previousBalance: lockedStudent.coinBalance,
            newBalance: updatedStudent.coinBalance,
            itemName: itemNames.join(', ') || null,
            firstTransactionId: created[0].id,
          };
        }

        const record = await tx.coinTransaction.create({
          data: {
            studentId,
            staffId,
            type: 'manual',
            amount: totalAmount,
            quantity: 1,
            comment: finalComment,
          },
          select: { id: true, amount: true },
        });

        return {
          transactionIds: [record.id],
          previousBalance: lockedStudent.coinBalance,
          newBalance: updatedStudent.coinBalance,
          itemName: null,
          firstTransactionId: record.id,
        };
      },
      { timeout: 10000 }
    );

    res.status(201).json({
      success: true,
      data: {
        transactionIds: result.transactionIds,
        firstTransactionId: result.firstTransactionId,
        previousBalance: result.previousBalance,
        newBalance: result.newBalance,
        itemName: result.itemName,
        message: `Списание выполнено успешно. Студент: ${student.fullName}, сумма: ${totalAmount} коинов`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelTransaction(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { transactionId } = req.params;
    const staffId = req.user!.userId;
    const userRole = req.user!.role;

    const transaction = await prisma.coinTransaction.findUnique({
      where: { id: transactionId },
      include: { student: true },
    });

    if (!transaction) {
      throw new NotFoundError('Транзакция');
    }

    // Student can only cancel their own transactions
    if (userRole === 'student' && transaction.studentId !== req.user!.studentId) {
      throw new ValidationError('Вы не можете отменить эту транзакцию');
    }

    const hoursSinceCreation = (Date.now() - transaction.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new ValidationError('Транзакция может быть отменена только в течение 24 часов после создания');
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Check isReversed INSIDE the transaction to prevent double-refund race
        const txRecord = await tx.coinTransaction.findUnique({
          where: { id: transactionId },
        });

        if (!txRecord || txRecord.isReversed) {
          throw new ValidationError('Транзакция уже была отменена');
        }

        const lockedStudent = await tx.student.findUnique({
          where: { id: transaction.studentId },
        });

        if (!lockedStudent) {
          throw new NotFoundError('Студент');
        }

        await tx.student.update({
          where: { id: transaction.studentId },
          data: {
            coinBalance: {
              increment: transaction.amount,
            },
          },
        });

        const cancelled = await tx.coinTransaction.update({
          where: { id: transactionId },
          data: {
            isReversed: true,
            reversedAt: new Date(),
            reversedBy: staffId,
          },
        });

        return {
          cancelled,
          newBalance: lockedStudent.coinBalance + transaction.amount,
          previousBalance: lockedStudent.coinBalance,
        };
      },
      { timeout: 10000 }
    );

    res.json({
      success: true,
      data: {
        transaction: result.cancelled,
        previousBalance: result.previousBalance,
        newBalance: result.newBalance,
        message: `Транзакция отменена. ${transaction.amount} коинов возвращено на баланс студента.`,
      },
    });
  } catch (err) {
    next(err);
  }
}
