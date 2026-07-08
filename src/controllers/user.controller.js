const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { AppError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

// Get all users (manager only)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Get user by ID (manager only)
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Create new user (manager only)
const createUser = async (req, res, next) => {
  try {
    const { username, password, fullName, email, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new AppError('Username already exists', 400, 'USERNAME_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        fullName,
        role,
      },
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        createdAt: true,
      },
    });

    // Create audit log (optional - skip if fails)
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'CREATE_USER',
          entity: 'User',
          entityId: user.id,
          changes: { username, role },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

// Update user role (manager only)
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        createdAt: true,
      },
    });

    // Create audit log (optional - skip if fails)
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'UPDATE_USER_ROLE',
          entity: 'User',
          entityId: id,
          changes: { oldRole: user.role, newRole: role },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};


// Delete user (manager only)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Hard delete user
    await prisma.user.delete({
      where: { id },
    });

    // Create audit log (optional - skip if fails)
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'DELETE_USER',
          entity: 'User',
          entityId: id,
          changes: { username: user.username, role: user.role },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUserRole,
  deleteUser,
};
