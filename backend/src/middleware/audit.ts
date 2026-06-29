import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { prisma } from '../utils/prisma';

const SENSITIVE_FIELDS = new Set(['password', 'token', 'secret']);

const ROUTE_PATTERNS: Array<{
  pattern: RegExp;
  resourceType: string;
  action: (method: string) => string;
  resourceIdGroup?: number;
}> = [
  { pattern: /^\/students\/([^/]+)\/withdraw$/, resourceType: 'student', action: () => 'withdraw', resourceIdGroup: 1 },
  { pattern: /^\/students\/([^/]+)\/deposit$/, resourceType: 'student', action: () => 'deposit', resourceIdGroup: 1 },
  { pattern: /^\/transactions\/([^/]+)\/cancel$/, resourceType: 'transaction', action: () => 'cancel', resourceIdGroup: 1 },
  { pattern: /^\/merch\/purchase$/, resourceType: 'purchase', action: () => 'purchase' },
  { pattern: /^\/purchases\/([^/]+)\/collect$/, resourceType: 'purchase', action: () => 'collect', resourceIdGroup: 1 },
  { pattern: /^\/merch\/items$/, resourceType: 'merch', action: (m) => m === 'POST' ? 'create_merch' : 'update_merch' },
  { pattern: /^\/merch\/items\/([^/]+)$/, resourceType: 'merch', action: (m) => m === 'PUT' ? 'update_merch' : 'archive_merch', resourceIdGroup: 1 },
  { pattern: /^\/merch\/reorder$/, resourceType: 'merch', action: () => 'reorder_merch' },
];

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body || typeof body !== 'object') return body;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = '***';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function auditMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || !['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  const path = req.path;
  let action = '';
  let resourceType = '';
  let resourceId = '';

  for (const entry of ROUTE_PATTERNS) {
    const match = path.match(entry.pattern);
    if (match) {
      action = entry.action(req.method);
      resourceType = entry.resourceType;
      resourceId = entry.resourceIdGroup ? match[entry.resourceIdGroup] : '';
      break;
    }
  }

  if (!action) {
    return next();
  }

  res.on('finish', () => {
    prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action,
        resourceType,
        resourceId,
        metadata: JSON.stringify({
          method: req.method,
          path,
          body: sanitizeBody((req.body as Record<string, unknown>) || {}),
          query: req.query,
          statusCode: res.statusCode,
        }),
        ip: req.ip,
        userAgent: req.headers['user-agent'] || '',
      },
    }).catch(() => {});
  });

  next();
}
