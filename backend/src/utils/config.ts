import { Secret, SignOptions } from 'jsonwebtoken';

export function getJwtSecret(): Secret {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

export function getJwtExpiresIn(): SignOptions['expiresIn'] {
  return (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'];
}
