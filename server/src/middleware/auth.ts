import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, TokenPayload } from '../utils/auth';

const prisma = new PrismaClient();

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  department?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Optional authentication middleware: if Bearer token present, extracts user.
 * If not present or invalid, proceeds without setting req.user.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            mustChangePassword: true,
            department: true,
          },
        });
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }
  } catch (_e) {
    // Proceed without req.user
  }
  next();
}

/**
 * Extracts Bearer token, verifies JWT, and validates that user is active in DB.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token required',
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // Check DB status for real-time activation check
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        department: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User account not found',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account is inactive. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('requireAuth error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * BR-02: A user marked as requiring a password change cannot enter the normal application
 * until a new valid password is saved.
 */
export function checkPasswordChange(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.user.mustChangePassword) {
    return res.status(403).json({
      error: 'Password Change Required',
      message: 'You must change your initial password before accessing this resource.',
      mustChangePassword: true,
    });
  }
  next();
}

/**
 * Role-based authorization guard.
 */
export function requireRole(...permittedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }
    if (!permittedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: insufficient permissions for this action',
      });
    }
    next();
  };
}
