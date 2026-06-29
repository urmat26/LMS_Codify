import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

// Get group IDs that a staff member is allowed to see.
// If the user has no assignments, returns null (meaning "all groups").
async function getFilteredGroupIds(userId: string): Promise<string[] | null> {
  const assignments = await prisma.staffGroup.findMany({
    where: { userId },
    select: { groupId: true },
  });
  if (assignments.length === 0) return null;
  return assignments.map((a) => a.groupId);
}

export async function getAllGroups(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const allowedGroupIds = await getFilteredGroupIds(userId);

    const where: Record<string, unknown> = { isActive: true };
    if (allowedGroupIds) {
      where.id = { in: allowedGroupIds };
    }

    const groups = await prisma.group.findMany({
      where,
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

export { getFilteredGroupIds };
