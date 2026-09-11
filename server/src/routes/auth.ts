import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  signToken,
  comparePassword,
  hashPassword,
  isValidPassword,
} from '../utils/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/login - Authenticate credentials and return token
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // BR-01: Only an active user with valid credentials may authenticate
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account is inactive. Please contact support.',
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/logout - Invalidate access
router.post('/logout', requireAuth, async (_req: Request, res: Response) => {
  return res.status(200).json({
    message: 'Logged out successfully.',
  });
});

// GET /api/auth/me - Retrieve authenticated user profile
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  return res.status(200).json({
    user: req.user,
  });
});

// POST /api/auth/change-password - Change current password
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Current password and new password are required.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User account not found.',
      });
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Current password is incorrect.',
      });
    }

    // BR-03: Validate new password complexity
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        error: 'Weak Password',
        message:
          'New password must be at least 8 characters long, contain uppercase and lowercase letters, at least one number, and one special character.',
      });
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    return res.status(200).json({
      message: 'Password changed successfully.',
      mustChangePassword: false,
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
