import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

export async function getAllGroups(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const groups = await prisma.group.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { students: { where: { isActive: true } } },
        },
      },
    });

    const result = groups.map((group) => ({
      id: group.id,
      name: group.name,
      course: group.course,
      studentCount: group._count.students,
    }));

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
