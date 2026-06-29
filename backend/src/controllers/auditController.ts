import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  action: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export async function getAuditLogs(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit, action, userId, dateFrom, dateTo } = auditQuerySchema.parse(req.query);

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo);
      where.createdAt = createdAt;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
