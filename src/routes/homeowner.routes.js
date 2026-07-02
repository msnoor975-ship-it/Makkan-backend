const express = require('express');
const router = express.Router();
const {
  createHomeowner,
  listHomeowners,
  getHomeowner,
  deleteHomeowner,
} = require('../controllers/homeowner.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/homeowners:
 *   post:
 *     summary: Create homeowner
 *     description: Create a new homeowner record
 *     tags:
 *       - Homeowners
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHomeownerRequest'
 *           example:
 *             fullName: "Jane Smith"
 *             phone: "9876543210"
 *     responses:
 *       201:
 *         description: Homeowner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Homeowner'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  requireAuth,
  requireRole('sales_employee', 'rental_employee', 'manager'),
  asyncHandler(createHomeowner)
);

/**
 * @swagger
 * /api/homeowners:
 *   get:
 *     summary: List homeowners
 *     description: List all homeowners with their houses
 *     tags:
 *       - Homeowners
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of homeowners
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Homeowner'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  requireAuth,
  requireRole('sales_employee', 'rental_employee', 'manager', 'secretary'),
  asyncHandler(listHomeowners)
);

/**
 * @swagger
 * /api/homeowners/{id}:
 *   get:
 *     summary: Get homeowner by ID
 *     description: View homeowner profile with houses and reservations
 *     tags:
 *       - Homeowners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Homeowner ID
 *     responses:
 *       200:
 *         description: Homeowner details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Homeowner'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Homeowner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id',
  requireAuth,
  requireRole('sales_employee', 'rental_employee', 'manager', 'secretary'),
  asyncHandler(getHomeowner)
);

/**
 * @swagger
 * /api/homeowners/{id}:
 *   delete:
 *     summary: Delete homeowner
 *     description: Delete a homeowner record
 *     tags:
 *       - Homeowners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Homeowner ID
 *     responses:
 *       200:
 *         description: Homeowner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Homeowner deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Homeowner not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('sales_employee', 'rental_employee', 'manager'),
  asyncHandler(deleteHomeowner)
);

module.exports = router;
