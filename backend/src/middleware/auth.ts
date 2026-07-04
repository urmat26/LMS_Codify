import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthPayload, AuthRequest } from '../types';
import { ForbiddenError } from '../utils/errors';
import { getJwtSecret } from '../utils/config';

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ForbiddenError());
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(new ForbiddenError());
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError());
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }

    next();
  };
}
