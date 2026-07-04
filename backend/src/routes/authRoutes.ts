import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../utils/prisma';
import { ValidationError } from '../utils/errors';
import { getJwtSecret, getJwtExpiresIn } from '../utils/config';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Слишком много попыток входа. Повторите через минуту.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  fullName: z.string().min(1),
  groupId: z.string().uuid(),
});

router.post('/auth/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { student: true },
    });

    if (!user || !user.isActive) {
      throw new ValidationError('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ValidationError('Неверный email или пароль');
    }

    const jwtPayload: Record<string, unknown> = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // For student role, include studentId in JWT
    if (user.role === 'student' && user.student) {
      jwtPayload.studentId = user.student.id;
    }

    const token = jwt.sign(jwtPayload, getJwtSecret(), { expiresIn: getJwtExpiresIn() });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          ...(user.role === 'student' && user.student
            ? { student: { id: user.student.id, coinBalance: user.student.coinBalance, groupId: user.student.groupId } }
            : {}),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// Student self-registration
router.post('/auth/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      throw new ValidationError('Пользователь с таким email уже существует');
    }

    const group = await prisma.group.findUnique({ where: { id: body.groupId, isActive: true } });
    if (!group) {
      throw new ValidationError('Группа не найдена');
    }

    const password = await bcrypt.hash(body.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email,
          password,
          fullName: body.fullName,
          role: 'student',
        },
      });

      const student = await tx.student.create({
        data: {
          fullName: body.fullName,
          email: body.email,
          groupId: body.groupId,
          coinBalance: 500,
          userId: user.id,
        },
      });

      return { user, student };
    });

    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email, role: 'student', studentId: result.student.id },
      getJwtSecret(),
      { expiresIn: getJwtExpiresIn() }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          role: 'student',
          student: { id: result.student.id, coinBalance: result.student.coinBalance, groupId: result.student.groupId },
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// Current user profile
router.get('/auth/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });

    if (!user) {
      throw new ValidationError('Пользователь не найден');
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        ...(user.student
          ? { student: { id: user.student.id, coinBalance: user.student.coinBalance, groupId: user.student.groupId } }
          : {}),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
