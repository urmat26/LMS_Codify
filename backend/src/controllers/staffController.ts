import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { NotFoundError } from '../utils/errors';

const assignGroupSchema = z.object({
  userId: z.string().uuid(),
  groupIds: z.array(z.string().uuid()),
});

export async function getStaffGroupAssignments(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assignments = await prisma.staffGroup.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
        group: { select: { id: true, name: true, course: true } },
      },
      orderBy: [{ userId: 'asc' }, { groupId: 'asc' }],
    });

    // Group by user
    const grouped: Record<string, { user: { id: string; fullName: string; email: string; role: string }; groups: Array<{ id: string; name: string; course: number }> }> = {};
    for (const a of assignments) {
      if (!grouped[a.userId]) {
        grouped[a.userId] = {
          user: a.user,
          groups: [],
        };
      }
      grouped[a.userId].groups.push(a.group);
    }

    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    next(err);
  }
}

export async function assignGroups(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, groupIds } = assignGroupSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId, isActive: true } });
    if (!user || user.role === 'student') {
      throw new NotFoundError('Пользователь');
    }

    // Verify all groups exist
    const groups = await prisma.group.findMany({
      where: { id: { in: groupIds }, isActive: true },
    });
    if (groups.length !== groupIds.length) {
      throw new NotFoundError('Группа');
    }

    const uniqueGroupIds = [...new Set(groupIds)];

    await prisma.$transaction(async (tx) => {
      await tx.staffGroup.deleteMany({ where: { userId } });
      if (uniqueGroupIds.length > 0) {
        await tx.staffGroup.createMany({
          data: uniqueGroupIds.map((groupId) => ({ userId, groupId })),
        });
      }
    });

    res.json({ success: true, message: 'Привязки обновлены' });
  } catch (err) {
    next(err);
  }
}

export async function getMyGroups(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const assignments = await prisma.staffGroup.findMany({
      where: { userId },
      include: { group: true },
    });
    const groups = assignments.map((a) => a.group);
    res.json({ success: true, data: groups });
  } catch (err) {
    next(err);
  }
}
