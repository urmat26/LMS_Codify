import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { NotFoundError, ValidationError, InsufficientBalanceError } from '../utils/errors';

const purchaseSchema = z.object({
  items: z.array(
    z.object({
      merchItemId: z.string().uuid(),
      quantity: z.number().int().min(1).default(1),
      size: z.string().optional(),
    })
  ).min(1, 'Добавьте хотя бы один товар'),
});

export async function purchase(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.user!.studentId;
    if (!studentId) {
      throw new ValidationError('Студент не найден');
    }
    const staffId = req.user!.userId;
    const body = purchaseSchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: { id: studentId, isActive: true },
    });

    if (!student) {
      throw new NotFoundError('Студент');
    }

    // Fetch all merch items in one query
    const ids = body.items.map((i) => i.merchItemId);
    const merchItems = await prisma.merchItem.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { sizes: true },
    });

    if (merchItems.length !== new Set(ids).size) {
      throw new NotFoundError('Один или несколько товаров не найдены');
    }

    const merchMap = new Map(merchItems.map((m) => [m.id, m]));
    let totalAmount = 0;
    const lines: { merchItemId: string; quantity: number; size: string | null; price: number }[] = [];

    for (const item of body.items) {
      const merch = merchMap.get(item.merchItemId);
      if (!merch) {
        throw new NotFoundError(`Товар ${item.merchItemId}`);
      }

      // Check general stock
      if (merch.stock < item.quantity) {
        throw new ValidationError(`Недостаточно товара "${merch.name}" на складе (доступно: ${merch.stock})`);
      }

      // If size specified, check size-level stock
      if (item.size) {
        const sizeRecord = merch.sizes.find((s) => s.size === item.size);
        if (!sizeRecord || sizeRecord.quantity < item.quantity) {
          throw new ValidationError(`Недостаточно товара "${merch.name}" размера ${item.size} (доступно: ${sizeRecord?.quantity || 0})`);
        }
      }

      const cost = merch.price * item.quantity;
      totalAmount += cost;
      lines.push({ merchItemId: item.merchItemId, quantity: item.quantity, size: item.size || null, price: merch.price });
    }

    if (totalAmount <= 0) {
      throw new ValidationError('Сумма покупки должна быть положительной');
    }

    const result = await prisma.$transaction(async (tx) => {
      const lockedStudent = await tx.student.findUnique({ where: { id: studentId } });
      if (!lockedStudent) throw new NotFoundError('Студент');
      if (lockedStudent.coinBalance < totalAmount) {
        throw new InsufficientBalanceError(lockedStudent.coinBalance, totalAmount);
      }

      await tx.student.update({
        where: { id: studentId },
        data: { coinBalance: { decrement: totalAmount } },
      });

      const createdPurchases = await Promise.all(
        lines.map((line) =>
          tx.purchase.create({
            data: {
              studentId,
              merchItemId: line.merchItemId,
              size: line.size,
              quantity: line.quantity,
              totalAmount: line.price * line.quantity,
              status: 'pending',
            },
          })
        )
      );

      // Update stock
      for (const line of lines) {
        await tx.merchItem.update({
          where: { id: line.merchItemId },
          data: { stock: { decrement: line.quantity } },
        });

        if (line.size) {
          await tx.merchSize.update({
            where: {
              merchItemId_size: { merchItemId: line.merchItemId, size: line.size },
            },
            data: { quantity: { decrement: line.quantity } },
          });
        }
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: staffId,
          action: 'purchase',
          resourceType: 'purchase',
          resourceId: createdPurchases[0].id,
          metadata: JSON.stringify({
            items: lines,
            totalAmount,
            purchaseIds: createdPurchases.map((p) => p.id),
          }),
        },
      });

      return { purchases: createdPurchases, newBalance: lockedStudent.coinBalance - totalAmount };
    }, { timeout: 10000 });

    res.status(201).json({
      success: true,
      data: {
        purchases: result.purchases,
        newBalance: result.newBalance,
        message: `Покупка совершена. Списано ${totalAmount} коинов.`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyPurchases(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.user!.studentId;
    if (!studentId) {
      throw new ValidationError('Студент не найден');
    }

    const purchases = await prisma.purchase.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        merchItem: { select: { id: true, name: true, price: true, imageUrl: true } },
      },
    });

    res.json({ success: true, data: purchases });
  } catch (err) {
    next(err);
  }
}

export async function getAllPurchases(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const purchases = await prisma.purchase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, fullName: true } },
        merchItem: { select: { id: true, name: true, price: true, imageUrl: true } },
      },
    });

    res.json({ success: true, data: purchases });
  } catch (err) {
    next(err);
  }
}

export async function collectPurchase(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { purchaseId } = req.params;
    const staffId = req.user!.userId;

    const purchaseRecord = await prisma.purchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchaseRecord) {
      throw new NotFoundError('Покупка');
    }

    if (purchaseRecord.status !== 'pending') {
      throw new ValidationError('Покупка уже была получена или отменена');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchase.update({
        where: { id: purchaseId },
        data: { status: 'collected', collectedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId: staffId,
          action: 'collect',
          resourceType: 'purchase',
          resourceId: purchaseId,
          metadata: JSON.stringify({ studentId: purchaseRecord.studentId }),
        },
      });

      return updated;
    });

    res.json({
      success: true,
      data: result,
      message: 'Товар отмечен как полученный',
    });
  } catch (err) {
    next(err);
  }
}

export async function getMerchCatalog(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { category, search } = req.query;

    const where: Record<string, unknown> = { isActive: true, stock: { gt: 0 } };
    if (category && category !== 'Все') {
      where.category = category;
    }
    if (search) {
      where.name = { contains: search as string };
    }

    const items = await prisma.merchItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { sizes: true },
    });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}
