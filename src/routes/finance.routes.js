const express = require('express');
const router = express.Router();
const { createFinance, listFinance } = require('../controllers/finance.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/finance:
 *   post:
 *     summary: Create financial account entry
 *     description: Create a new financial account entry (secretary role only)
 *     tags:
 *       - Finance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFinanceRequest'
 *           example:
 *             category: "utilities"
 *             amount: 150.50
 *             description: "Electric bill"
 *             entryDate: "2024-01-15T10:00:00Z"
 *     responses:
 *       201:
 *         description: Financial entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinancialAccount'
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
 *         description: Forbidden - insufficient permissions (secretary only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', requireAuth, requireRole('secretary'), asyncHandler(createFinance));

/**
 * @swagger
 * /api/finance:
 *   get:
 *     summary: List financial entries
 *     description: List financial entries with optional filters by category or date range (manager role only)
 *     tags:
 *       - Finance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [utilities, wages, household_expenses, tenant_expenses]
 *         description: Filter by category
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: List of financial entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FinancialAccount'
 *       400:
 *         description: Invalid category filter
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
 *         description: Forbidden - insufficient permissions (manager only)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', requireAuth, requireRole('manager'), asyncHandler(listFinance));

module.exports = router;
