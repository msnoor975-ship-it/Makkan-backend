const express = require('express');
const router = express.Router();
const {
  createHouse,
  listHouses,
  getHouse,
  updateHouse,
  deleteHouse,
} = require('../controllers/house.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/houses:
 *   post:
 *     summary: Create house
 *     description: Create a new house listing
 *     tags:
 *       - Houses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHouseRequest'
 *           example:
 *             address: "123 Main St"
 *             specifications: "3 bedrooms, 2 bathrooms"
 *             price: 250000
 *             listingType: "sale"
 *             status: "available"
 *             homeownerId: "uuid-of-homeowner"
 *     responses:
 *       201:
 *         description: House created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/House'
 *       400:
 *         description: Validation error or homeowner not found
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
  asyncHandler(createHouse)
);

/**
 * @swagger
 * /api/houses:
 *   get:
 *     summary: List houses
 *     description: List houses with optional filters for status and listing type (public endpoint)
 *     tags:
 *       - Houses
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, reserved, sold]
 *         description: Filter by house status
 *       - in: query
 *         name: listingType
 *         schema:
 *           type: string
 *           enum: [sale, rent]
 *         description: Filter by listing type
 *     responses:
 *       200:
 *         description: List of houses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/House'
 */
router.get(
  '/',
  asyncHandler(listHouses)
);

/**
 * @swagger
 * /api/houses/{id}:
 *   get:
 *     summary: Get house by ID
 *     description: View house profile with homeowner and reservations (public endpoint)
 *     tags:
 *       - Houses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: House ID
 *     responses:
 *       200:
 *         description: House details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/House'
 *       404:
 *         description: House not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id',
  asyncHandler(getHouse)
);

/**
 * @swagger
 * /api/houses/{id}:
 *   put:
 *     summary: Update house
 *     description: Update house information
 *     tags:
 *       - Houses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: House ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateHouseRequest'
 *           example:
 *             address: "456 Updated St"
 *             price: 275000
 *     responses:
 *       200:
 *         description: House updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/House'
 *       400:
 *         description: Validation error or homeowner not found
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
 *       404:
 *         description: House not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('sales_employee', 'rental_employee', 'manager'),
  asyncHandler(updateHouse)
);

/**
 * @swagger
 * /api/houses/{id}:
 *   delete:
 *     summary: Delete house
 *     description: Delete a house record
 *     tags:
 *       - Houses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: House ID
 *     responses:
 *       200:
 *         description: House deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "House deleted successfully"
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
 *         description: House not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('sales_employee', 'rental_employee', 'manager'),
  asyncHandler(deleteHouse)
);

module.exports = router;
