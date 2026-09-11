import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'toktickit-jwt-token-secret-cpe334-lab3';
const JWT_EXPIRES_IN = '24h';

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
  name: string;
  mustChangePassword?: boolean;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (_err) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * BR-03: Passwords must be at least 8 characters long, include both uppercase and lowercase letters,
 * and contain at least one number and one special character.
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string' || password.length < 8) {
    return false;
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return hasUpper && hasLower && hasNumber && hasSpecial;
}
