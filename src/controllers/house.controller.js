const { z } = require('zod');
const prisma = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Validation schemas
 */
const createHouseSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  specifications: z.string().optional(),
  price: z.string().or(z.number()).transform((val) => {
    if (typeof val === 'number') return val;
    return parseFloat(val);
  }),
  listingType: z.enum(['sale', 'rent'], {
    errorMap: () => ({ message: 'Listing type must be sale or rent' }),
  }),
  status: z.enum(['available', 'reserved', 'sold'], {
    errorMap: () => ({ message: 'Status must be available, reserved, or sold' }),
  }),
  homeownerId: z.string().min(1, 'Homeowner ID is required'),
  imageUrl: z.string().optional(),
});

const updateHouseSchema = z.object({
  address: z.string().min(1, 'Address is required').optional(),
  specifications: z.string().optional(),
  price: z.string().or(z.number()).transform((val) => {
    if (typeof val === 'number') return val;
    return parseFloat(val);
  }).optional(),
  listingType: z.enum(['sale', 'rent'], {
    errorMap: () => ({ message: 'Listing type must be sale or rent' }),
  }).optional(),
  status: z.enum(['available', 'reserved', 'sold'], {
    errorMap: () => ({ message: 'Status must be available, reserved, or sold' }),
  }).optional(),
  homeownerId: z.string().min(1, 'Homeowner ID is required').optional(),
  imageUrl: z.string().optional(),
});

const searchHousesSchema = z.object({
  listingType: z.enum(['sale', 'rent']).optional(),
  minPrice: z.string().or(z.number()).transform((val) => {
    if (typeof val === 'number') return val;
    return parseFloat(val);
  }).optional(),
  maxPrice: z.string().or(z.number()).transform((val) => {
    if (typeof val === 'number') return val;
    return parseFloat(val);
  }).optional(),
  location: z.string().optional(),
});

/**
 * POST /api/houses
 * Create house - sales_employee or rental_employee only
 * Validates that homeownerId exists
 */
const createHouse = async (req, res, next) => {
  const data = createHouseSchema.parse(req.body);

  // Validate homeowner exists
  const homeowner = await prisma.homeowner.findUnique({
    where: { id: data.homeownerId },
  });

  if (!homeowner) {
    throw new AppError('Homeowner not found', 400, 'HOMEOWNER_NOT_FOUND');
  }

  const house = await prisma.house.create({
    data: {
      ...data,
      addedByUserId: req.user.userId,
    },
    include: {
      homeowner: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
      addedByUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    },
  });

  res.status(201).json(house);
};

/**
 * GET /api/houses
 * List houses with optional filters - sales_employee or rental_employee only
 */
const listHouses = async (req, res, next) => {
  const { status, listingType } = req.query;

  const where = {};
  if (status) {
    where.status = status;
  }
  if (listingType) {
    where.listingType = listingType;
  }

  const houses = await prisma.house.findMany({
    where,
    include: {
      homeowner: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
      addedByUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
      reservations: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(houses);
};

/**
 * GET /api/houses/:id
 * View house profile - sales_employee or rental_employee only
 */
const getHouse = async (req, res, next) => {
  const { id } = req.params;

  const house = await prisma.house.findUnique({
    where: { id },
    include: {
      homeowner: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
      addedByUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
      reservations: {
        include: {
          customer: true,
          handledByUser: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!house) {
    throw new AppError('House not found', 404, 'HOUSE_NOT_FOUND');
  }

  res.json(house);
};

/**
 * PUT /api/houses/:id
 * Update house - sales_employee or rental_employee only
 */
const updateHouse = async (req, res, next) => {
  const { id } = req.params;
  const data = updateHouseSchema.parse(req.body);

  // If homeownerId is being updated, validate it exists
  if (data.homeownerId) {
    const homeowner = await prisma.homeowner.findUnique({
      where: { id: data.homeownerId },
    });

    if (!homeowner) {
      throw new AppError('Homeowner not found', 400, 'HOMEOWNER_NOT_FOUND');
    }
  }

  const existingHouse = await prisma.house.findUnique({
    where: { id },
  });

  if (!existingHouse) {
    throw new AppError('House not found', 404, 'HOUSE_NOT_FOUND');
  }

  const house = await prisma.house.update({
    where: { id },
    data,
    include: {
      homeowner: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
      addedByUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    },
  });

  res.json(house);
};

/**
 * DELETE /api/houses/:id
 * Delete house - sales_employee or rental_employee only
 */
const deleteHouse = async (req, res, next) => {
  const { id } = req.params;

  const existingHouse = await prisma.house.findUnique({
    where: { id },
  });

  if (!existingHouse) {
    throw new AppError('House not found', 404, 'HOUSE_NOT_FOUND');
  }

  await prisma.house.delete({
    where: { id },
  });

  res.json({ message: 'House deleted successfully' });
};

/**
 * GET /api/houses/search
 * Search for available houses with filters
 */
const searchHouses = async (req, res, next) => {
  const { listingType, minPrice, maxPrice, location } = searchHousesSchema.parse(req.query);

  const where = {
    status: 'available',
  };

  if (listingType) {
    where.listingType = listingType;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  if (location) {
    where.address = {
      contains: location,
      mode: 'insensitive',
    };
  }

  const houses = await prisma.house.findMany({
    where,
    include: {
      homeowner: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(houses);
};

module.exports = {
  createHouse,
  listHouses,
  getHouse,
  updateHouse,
  deleteHouse,
  searchHouses,
};
