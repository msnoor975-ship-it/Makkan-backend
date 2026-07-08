const express = require('express');
const router = express.Router();
const { searchAndReserve, listReservations, createReservation } = require('../controllers/reservation.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/reservations/search-and-reserve:
 *   post:
 *     summary: Search and reserve house
 *     description: Search for available house matching criteria and create reservation atomically
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SearchAndReserveRequest'
 *           example:
 *             customerId: "uuid-of-customer"
 *             listingType: "sale"
 *             minPrice: 200000
 *             maxPrice: 300000
 *             location: "Main St"
 *             reservationDate: "2024-01-15T10:00:00Z"
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Validation error or customer not found
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
 *         description: No available house matching criteria
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/search-and-reserve',
  requireAuth,
  requireRole('sales_employee', 'rental_employee', 'manager'),
  asyncHandler(searchAndReserve)
);

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: List reservations
 *     description: List reservations with optional filters by customer or house
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *       - in: query
 *         name: houseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by house ID
 *     responses:
 *       200:
 *         description: List of reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
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
  requireRole('sales_employee', 'rental_employee', 'manager'),
  asyncHandler(listReservations)
);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create reservation
 *     description: Create the reservation for a specific house and customer
 *     tags:
 *       - Reservations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               houseId:
 *                 type: string
 *                 format: uuid
 *               reservationDate:
 *                 type: string
 *                 format: date-time
 *           example:
 *             customerId: "uuid-of-customer"
 *             houseId: "uuid-of-house"
 *             reservationDate: "2024-01-15T10:00:00Z"
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       400:
 *         description: Validation error or house not available
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post(
  '/',
  requireAuth,
  requireRole('sales_employee', 'rental_employee', 'manager'),
  asyncHandler(createReservation)
);

module.exports = router;
