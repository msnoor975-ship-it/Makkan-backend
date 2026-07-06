const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Validation schemas
 */
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email').optional(),
});

/**
 * POST /api/auth/login
 * Validates username/password and returns JWT token
 */
const login = async (req, res, next) => {
  const { username, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    },
  });
};

/**
 * POST /api/auth/change-password
 * Requires current password match, validates and hashes new one
 */
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  });

  res.json({ message: 'Password changed successfully' });
};

/**
 * POST /api/auth/logout
 * Stateless - just confirms the contract
 */
const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

/**
 * POST /api/auth/register
 * Creates a new user with pending status
 */
const register = async (req, res, next) => {
  const { username, password, fullName, email } = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    throw new AppError('Username already exists', 400, 'USERNAME_EXISTS');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user with pending status
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      fullName,
      email,
      role: 'sales_employee', // Default role
      status: 'pending', // Requires manager approval
    },
    select: {
      id: true,
      username: true,
      role: true,
      status: true,
      fullName: true,
      email: true,
      createdAt: true,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_REGISTRATION',
      entity: 'User',
      entityId: user.id,
      changes: { username, role: 'sales_employee', status: 'pending' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.status(201).json({
    message: 'Registration successful. Your account is pending approval from a manager.',
    user,
  });
};

module.exports = {
  login,
  changePassword,
  logout,
  register,
};
