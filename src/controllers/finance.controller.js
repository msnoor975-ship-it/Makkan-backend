const { z } = require('zod');
const prisma = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Allowed categories
 */
const ALLOWED_CATEGORIES = [
  'utilities',
  'wages',
  'household_expenses',
  'tenant_expenses',
];

/**
 * Validation schemas
 */
const createFinanceSchema = z.object({
  category: z.enum(ALLOWED_CATEGORIES, {
    errorMap: () => ({
      message: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
    }),
  }),
  amount: z.string().or(z.number()).transform((val) => {
    if (typeof val === 'number') return val;
    return parseFloat(val);
  }).refine((val) => val > 0, {
    message: 'Amount must be a positive number',
  }),
  description: z.string().optional(),
  entryDate: z.string().or(z.date()).transform((val) => {
    if (val instanceof Date) return val;
    return new Date(val);
  }).optional(),
});

/**
 * POST /api/finance
 * Create financial account entry - secretary role only
 */
const createFinance = async (req, res, next) => {
  const data = createFinanceSchema.parse(req.body);

  const finance = await prisma.financialAccount.create({
    data: {
      ...data,
      recordedByUserId: req.user.userId,
    },
    include: {
      recordedByUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    },
  });

  res.status(201).json(finance);
};

/**
 * GET /api/finance
 * List financial entries with optional filters - manager role only
 */
const listFinance = async (req, res, next) => {
  const { category, startDate, endDate } = req.query;

  const where = {};

  if (category) {
    if (!ALLOWED_CATEGORIES.includes(category)) {
      throw new AppError(
        `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
        400,
        'INVALID_CATEGORY'
      );
    }
    where.category = category;
  }

  if (startDate || endDate) {
    where.entryDate = {};
    if (startDate) {
      where.entryDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.entryDate.lte = new Date(endDate);
    }
  }

  const finances = await prisma.financialAccount.findMany({
    where,
    include: {
      recordedByUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      entryDate: 'desc',
    },
  });

  res.json(finances);
};

module.exports = {
  createFinance,
  listFinance,
};
