const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getPendingUsers,
} = require('../controllers/user.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

// All user management routes require authentication and manager role
router.use(requireAuth);
router.use(requireRole('manager'));

// Get all users
router.get('/', asyncHandler(getAllUsers));

// Get pending users (approval queue)
router.get('/pending', asyncHandler(getPendingUsers));

// Get user by ID
router.get('/:id', asyncHandler(getUserById));

// Create new user
router.post('/', asyncHandler(createUser));

// Update user status
router.patch('/:id/status', asyncHandler(updateUserStatus));

// Update user role
router.patch('/:id/role', asyncHandler(updateUserRole));

// Delete user (soft delete)
router.delete('/:id', asyncHandler(deleteUser));

module.exports = router;
