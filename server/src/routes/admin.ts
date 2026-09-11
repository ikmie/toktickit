import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, checkPasswordChange, requireRole } from '../middleware/auth';
import { hashPassword, isValidPassword } from '../utils/auth';

const router = Router();
const prisma = new PrismaClient();

// Guard all admin routes: authentication, password changed, and ADMIN role
router.use(requireAuth);
router.use(checkPasswordChange);
router.use(requireRole('ADMIN'));

// Select fields safely omitting passwordHash
const userSafeSelect = {
  id: true,
  name: true,
  email: true,
  department: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
};

// GET /api/admin/users - Query users with search, role filter, status filter, sorting, pagination
router.get('/users', async (req: Request, res: Response) => {
  try {
    const {
      search,
      role,
      status,
      sortBy = 'name',
      sortOrder = 'asc',
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { department: { contains: q } },
      ];
    }

    if (role && typeof role === 'string' && ['REQUESTER', 'IT_STAFF', 'ADMIN'].includes(role)) {
      where.role = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const validSortFields = ['name', 'email', 'role', 'department', 'createdAt', 'isActive'];
    const orderField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'name';
    const orderDirection = (sortOrder as string).toLowerCase() === 'desc' ? 'desc' : 'asc';

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [orderField]: orderDirection },
        select: userSafeSelect,
      }),
    ]);

    return res.status(200).json({
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/admin/users - Create new user account with temporary password (FR-13)
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { name, email, department, role, password } = req.body;

    if (!name || !email || !department || !role) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, email, department, and role are required fields.',
      });
    }

    const validRoles = ['REQUESTER', 'IT_STAFF', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // BR-16: Duplicate email rejection
    const existing = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail } },
    });

    if (existing) {
      return res.status(400).json({
        error: 'Duplicate Email',
        message: 'A user with this email address already exists in TokTickIT.',
      });
    }

    // Determine temporary password
    const tempPassword = password && typeof password === 'string' && password.trim().length > 0
      ? password.trim()
      : 'Initial@Pass2026!';

    // Validate password complexity according to BR-03
    if (!isValidPassword(tempPassword)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.',
      });
    }

    const passwordHash = await hashPassword(tempPassword);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        department: department.trim(),
        role,
        passwordHash,
        mustChangePassword: true,
        isActive: true,
      },
      select: userSafeSelect,
    });

    return res.status(201).json({
      message: 'User account created successfully.',
      user: newUser,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/admin/users/:id - Edit existing user profile details (FR-14)
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid User ID' });
    }

    const { name, email, department, role } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User does not exist.' });
    }

    // Check duplicate email if updating email
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail } },
      });
      if (existing) {
        return res.status(400).json({
          error: 'Duplicate Email',
          message: 'A user with this email address already exists.',
        });
      }
    }

    // BR-18: Prevent demoting the last active administrator
    if (user.role === 'ADMIN' && role && role !== 'ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          error: 'Forbidden Action',
          message: 'Cannot reassign the role of the last active Administrator in the system.',
        });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (department) updateData.department = department.trim();
    if (role && ['REQUESTER', 'IT_STAFF', 'ADMIN'].includes(role)) updateData.role = role;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: userSafeSelect,
    });

    return res.status(200).json({
      message: 'User updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/admin/users/:id/status - Toggle active/inactive status (FR-15, BR-17, BR-18)
router.patch('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid User ID' });
    }

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Validation Error', message: 'isActive must be a boolean.' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Not Found', message: 'User does not exist.' });
    }

    // Deactivation checks
    if (isActive === false) {
      // BR-17: Self-deactivation prevention
      if (targetUser.id === req.user!.id) {
        return res.status(400).json({
          error: 'Forbidden Action',
          message: 'Administrators cannot deactivate their own active account.',
        });
      }

      // BR-18: Last administrator protection
      if (targetUser.role === 'ADMIN') {
        const activeAdminCount = await prisma.user.count({
          where: { role: 'ADMIN', isActive: true },
        });
        if (activeAdminCount <= 1) {
          return res.status(400).json({
            error: 'Forbidden Action',
            message: 'Cannot deactivate the last active Administrator in the system.',
          });
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: userSafeSelect,
    });

    return res.status(200).json({
      message: `User account has been ${isActive ? 'activated' : 'deactivated'}.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/admin/users/:id/reset-password - Reset user password to temporary (FR-16)
router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid User ID' });
    }

    const { newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User does not exist.' });
    }

    const tempPassword = newPassword && typeof newPassword === 'string' && newPassword.trim().length > 0
      ? newPassword.trim()
      : 'Reset@Pass2026!';

    // Validate password complexity (BR-03)
    if (!isValidPassword(tempPassword)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.',
      });
    }

    const passwordHash = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    return res.status(200).json({
      message: 'Password reset successfully. The user must set a new password upon their next login.',
      mustChangePassword: true,
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
