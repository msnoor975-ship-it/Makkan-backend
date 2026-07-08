const { z } = require('zod');
const prisma = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Validation schemas
 */
const searchAndReserveSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
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
  reservationDate: z.string().or(z.date()).transform((val) => {
    if (val instanceof Date) return val;
    return new Date(val);
  }).optional(),
});

/**
 * POST /api/reservations/search-and-reserve
 * Search for available house and create reservation in a transaction
 * sales_employee or rental_employee only
 */
const searchAndReserve = async (req, res, next) => {
  const { customerId, listingType, minPrice, maxPrice, location, reservationDate } =
    searchAndReserveSchema.parse(req.body);

  // Validate customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new AppError('Customer not found', 400, 'CUSTOMER_NOT_FOUND');
  }

  // Build house search criteria
  const houseWhere = {
    status: 'available',
  };

  if (listingType) {
    houseWhere.listingType = listingType;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    houseWhere.price = {};
    if (minPrice !== undefined) {
      houseWhere.price.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      houseWhere.price.lte = maxPrice;
    }
  }

  if (location) {
    houseWhere.address = {
      contains: location,
      mode: 'insensitive',
    };
  }

  // Use transaction to atomically find house, create reservation, and update status
  const result = await prisma.$transaction(async (tx) => {
    // Find first matching available house
    const house = await tx.house.findFirst({
      where: houseWhere,
      include: {
        homeowner: true,
      },
    });

    if (!house) {
      throw new AppError('No available house matching criteria', 404, 'NO_HOUSE_AVAILABLE');
    }

    // Create reservation
    const reservation = await tx.reservation.create({
      data: {
        customerId,
        houseId: house.id,
        handledByUserId: req.user.userId,
        reservationDate: reservationDate || new Date(),
        status: 'pending',
      },
      include: {
        customer: true,
        house: {
          include: {
            homeowner: true,
          },
        },
        handledByUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    // Update house status to reserved
    await tx.house.update({
      where: { id: house.id },
      data: { status: 'reserved' },
    });

    return reservation;
  });

  res.status(201).json(result);
};

/**
 * GET /api/reservations
 * List reservations with optional filters
 * sales_employee or rental_employee only
 */
const listReservations = async (req, res, next) => {
  const { customerId, houseId } = req.query;

  const where = {};
  if (customerId) {
    where.customerId = customerId;
  }
  if (houseId) {
    where.houseId = houseId;
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      customer: true,
      house: {
        include: {
          homeowner: true,
        },
      },
      handledByUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      reservationDate: 'desc',
    },
  });

  res.json(reservations);
};

/**
 * POST /api/reservations
 * Create a reservation for a specific house and customer
 * sales_employee or rental_employee only
 */
const createReservation = async (req, res, next) => {
  try {
    const { customerId, houseId, reservationDate } = req.body;

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new AppError('Customer not found', 400, 'CUSTOMER_NOT_FOUND');
    }

    // Validate house exists and is available
    const house = await prisma.house.findUnique({
      where: { id: houseId },
    });

    if (!house) {
      throw new AppError('House not found', 400, 'HOUSE_NOT_FOUND');
    }

    if (house.status !== 'available') {
      throw new AppError('House is not available for reservation', 400, 'HOUSE_NOT_AVAILABLE');
    }

    // Use transaction to atomically create reservation and update house status
    const result = await prisma.$transaction(async (tx) => {
      // Create reservation
      const reservation = await tx.reservation.create({
        data: {
          customerId,
          houseId,
          handledByUserId: req.user.userId,
          reservationDate: reservationDate ? new Date(reservationDate) : new Date(),
          status: 'pending',
        },
        include: {
          customer: true,
          house: {
            include: {
              homeowner: true,
            },
          },
          handledByUser: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      });

      // Update house status to reserved
      await tx.house.update({
        where: { id: houseId },
        data: { status: 'reserved' },
      });

      return reservation;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchAndReserve,
  listReservations,
  createReservation,
};
