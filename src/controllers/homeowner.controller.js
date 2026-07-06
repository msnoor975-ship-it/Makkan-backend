const { z } = require('zod');
const prisma = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Validation schemas
 */
const createHomeownerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
});

const updateHomeownerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  phone: z.string().optional(),
});

/**
 * POST /api/homeowners
 * Create homeowner - sales_employee or rental_employee only
 */
const createHomeowner = async (req, res, next) => {
  const data = createHomeownerSchema.parse(req.body);

  const homeowner = await prisma.homeowner.create({
    data: {
      ...data,
      addedByUserId: req.user.userId,
    },
  });

  res.status(201).json(homeowner);
};

/**
 * GET /api/homeowners
 * List homeowners - sales_employee or rental_employee only
 */
const listHomeowners = async (req, res, next) => {
  const homeowners = await prisma.homeowner.findMany({
    include: {
      addedByUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
      houses: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(homeowners);
};

/**
 * GET /api/homeowners/:id
 * View homeowner profile - sales_employee or rental_employee only
 */
const getHomeowner = async (req, res, next) => {
  const { id } = req.params;

  const homeowner = await prisma.homeowner.findUnique({
    where: { id },
    include: {
      addedByUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
      houses: {
        include: {
          reservations: true,
        },
      },
    },
  });

  if (!homeowner) {
    throw new AppError('Homeowner not found', 404, 'HOMEOWNER_NOT_FOUND');
  }

  res.json(homeowner);
};

/**
 * DELETE /api/homeowners/:id
 * Delete homeowner - sales_employee or rental_employee only
 */
const deleteHomeowner = async (req, res, next) => {
  const { id } = req.params;

  const existingHomeowner = await prisma.homeowner.findUnique({
    where: { id },
  });

  if (!existingHomeowner) {
    throw new AppError('Homeowner not found', 404, 'HOMEOWNER_NOT_FOUND');
  }

  await prisma.homeowner.delete({
    where: { id },
  });

  res.json({ message: 'Homeowner deleted successfully' });
};

module.exports = {
  createHomeowner,
  listHomeowners,
  getHomeowner,
  deleteHomeowner,
};
