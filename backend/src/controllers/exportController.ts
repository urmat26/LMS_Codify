import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { NotFoundError } from '../utils/errors';

export async function exportGroupCSV(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { groupId } = req.params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundError('Группа');
    }

    const students = await prisma.student.findMany({
      where: { groupId, isActive: true },
      orderBy: { fullName: 'asc' },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            staff: { select: { fullName: true } },
            merchItem: { select: { name: true } },
          },
        },
      },
    });

    const BOM = '\uFEFF';
    const header = 'ФИО студента;Email;Баланс коинов;Товар;Количество;Сумма списания;Дата;Комментарий;Сотрудник;Отменено';
    const rows = students.flatMap((student) => {
      if (student.transactions.length === 0) {
        return [`${student.fullName};${student.email || ''};${student.coinBalance};;;;;;;Нет`];
      }
      return student.transactions.map((tx) => {
        const itemName = tx.merchItem?.name || (tx.type === 'manual' ? 'Произвольное списание' : '');
        const date = new Date(tx.createdAt).toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const comment = (tx.comment || '').replace(/;/g, ',');
        const staffName = tx.staff?.fullName || '';
        const reversed = tx.isReversed ? 'Да' : 'Нет';
        return [
          student.fullName,
          student.email || '',
          student.coinBalance,
          itemName,
          tx.quantity,
          tx.amount,
          date,
          comment,
          staffName,
          reversed,
        ].join(';');
      });
    });

    const safeName = group.name.replace(/[^a-zA-Zа-яА-Я0-9_\- ]/g, '_');
    const filename = encodeURIComponent(`Codify_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.send(BOM + header + '\r\n' + rows.join('\r\n'));
  } catch (err) {
    next(err);
  }
}
