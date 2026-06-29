import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';

const merchItemSchema = z.object({
  name: z.string().min(1, 'Название товара обязательно').max(200),
  description: z.string().optional().nullable(),
  price: z.number().int().positive('Цена должна быть положительным числом'),
  category: z.string().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    })
  ),
});

export async function getCatalog(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const items = await prisma.merchItem.findMany({
      where,
      include: { sizes: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function getAllItems(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const items = await prisma.merchItem.findMany({
      include: { sizes: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function createItem(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = merchItemSchema.parse(req.body);

    const maxSortOrder = await prisma.merchItem.aggregate({
      _max: { sortOrder: true },
    });

    const item = await prisma.merchItem.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        category: data.category ?? null,
        stock: data.stock ?? 0,
        imageUrl: data.imageUrl || null,
        sortOrder: data.sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1,
      },
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function updateItem(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { itemId } = req.params;

    const existing = await prisma.merchItem.findUnique({
      where: { id: itemId },
    });

    if (!existing) {
      throw new NotFoundError('Товар');
    }

    const data = merchItemSchema.partial().parse(req.body);

    const item = await prisma.merchItem.update({
      where: { id: itemId },
      data,
    });

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function archiveItem(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { itemId } = req.params;

    const existing = await prisma.merchItem.findUnique({
      where: { id: itemId },
    });

    if (!existing) {
      throw new NotFoundError('Товар');
    }

    const item = await prisma.merchItem.update({
      where: { id: itemId },
      data: { isActive: false },
    });

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function reorderItems(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { items } = reorderSchema.parse(req.body);

    await prisma.$transaction(
      items.map((item) =>
        prisma.merchItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    const updated = await prisma.merchItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
