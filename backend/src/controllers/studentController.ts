import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { getFilteredGroupIds } from './groupController';

export async function getGroupStudents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { groupId } = req.params;
    const { search, includeInactive, page: pageStr, limit: limitStr, sortBy, sortOrder, hideServiced } = req.query;

    // Check staff group access
    const allowedGroupIds = await getFilteredGroupIds(userId);
    if (allowedGroupIds && !allowedGroupIds.includes(groupId)) {
      throw new ForbiddenError('У вас нет доступа к этой группе');
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundError('Группа');
    }

    const page = Math.max(1, parseInt(pageStr as string) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(limitStr as string) || 50));
    const skip = (page - 1) * limit;

    const validSortBy = ['fullName', 'coinBalance'];
    const orderField = validSortBy.includes(sortBy as string) ? (sortBy as string) : 'fullName';
    const orderDir = sortOrder === 'desc' ? 'desc' : 'asc';

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const whereClause: Prisma.StudentWhereInput = {
      groupId,
      ...(includeInactive !== 'true' ? { isActive: true } : {}),
      ...(search
        ? {
            fullName: {
              contains: search as string,
            },
          }
        : {}),
      ...(hideServiced === 'true'
        ? {
            transactions: {
              none: {
                createdAt: { gte: todayStart },
                isReversed: false,
              },
            },
          }
        : {}),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where: whereClause,
        orderBy: { [orderField]: orderDir },
        skip,
        take: limit,
        include: {
          transactions: {
            where: {
              createdAt: { gte: todayStart },
              isReversed: false,
            },
            select: { id: true, amount: true, type: true, createdAt: true },
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.student.count({ where: whereClause }),
    ]);

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

export async function searchStudents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { q } = req.query;

    if (!q || (q as string).trim().length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const allowedGroupIds = await getFilteredGroupIds(userId);

    const whereClause: Prisma.StudentWhereInput = {
      fullName: { contains: q as string },
      isActive: true,
      ...(allowedGroupIds ? { groupId: { in: allowedGroupIds } } : {}),
    };

    const students = await prisma.student.findMany({
      where: whereClause,
      take: 20,
      orderBy: { fullName: 'asc' },
      include: {
        group: { select: { id: true, name: true, course: true } },
        transactions: {
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            isReversed: false,
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    const result = students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      coinBalance: s.coinBalance,
      groupId: s.groupId,
      groupName: s.group.name,
      course: s.group.course,
      receivedMerchToday: s.transactions.length > 0,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
