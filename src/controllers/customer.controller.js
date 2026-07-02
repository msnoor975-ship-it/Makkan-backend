const { z } = require('zod');
const prisma = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * Validation schemas
 */
const createCustomerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  status: z.string().min(1, 'Status is required'),
  imageUrl: z.string().optional(),
});

const updateCustomerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  status: z.string().min(1, 'Status is required').optional(),
  imageUrl: z.string().optional(),
});

/**
 * POST /api/customers
 * Create customer - sales_employee or rental_employee only
 */
const createCustomer = async (req, res, next) => {
  const data = createCustomerSchema.parse(req.body);

  const customer = await prisma.customer.create({
    data: {
      ...data,
      addedByUserId: req.user.userId,
    },
  });

  res.status(201).json(customer);
};

/**
 * GET /api/customers
 * List customers with optional search - sales_employee or rental_employee only
 */
const listCustomers = async (req, res, next) => {
  const { search } = req.query;

  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const customers = await prisma.customer.findMany({
    where,
    include: {
      addedByUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(customers);
};

/**
 * GET /api/customers/:id
 * View customer profile - sales_employee, rental_employee, manager, or customer viewing own record
 */
const getCustomer = async (req, res, next) => {
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      addedByUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
      reservations: {
        include: {
          house: true,
        },
      },
    },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  res.json(customer);
};

/**
 * PUT /api/customers/:id
 * Update customer - sales_employee or rental_employee only
 */
const updateCustomer = async (req, res, next) => {
  const { id } = req.params;
  const data = updateCustomerSchema.parse(req.body);

  const existingCustomer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!existingCustomer) {
    throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  const customer = await prisma.customer.update({
    where: { id },
    data,
    include: {
      addedByUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    },
  });

  res.json(customer);
};

/**
 * DELETE /api/customers/:id
 * Delete customer - manager only
 */
const deleteCustomer = async (req, res, next) => {
  const { id } = req.params;

  const existingCustomer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!existingCustomer) {
    throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  await prisma.customer.delete({
    where: { id },
  });

  res.json({ message: 'Customer deleted successfully' });
};

module.exports = {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
};
