const { Op } = require('sequelize');
const { Customer, User, Opportunity, FollowUp, Activity } = require('../models');
const { logAudit } = require('../utils/auditLogger');

function applyCustomerScope(user) {
  if (user.roleName === 'Admin' || user.roleName === 'Manager') {
    return {};
  }
  // Sales Executive only sees assigned/created customers
  return { CreatedBy: user.userId };
}

async function getCustomers(user, query = {}) {
  const { search, status, city, ownerId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

  const scope = applyCustomerScope(user);
  const where = { ...scope };

  if (status) {
    where.Status = status;
  }
  if (city) {
    where.City = { [Op.like]: `%${city}%` };
  }
  if (ownerId && (user.roleName === 'Admin' || user.roleName === 'Manager')) {
    where.CreatedBy = ownerId;
  }

  if (search) {
    const s = `%${search.trim()}%`;
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [
        { CustomerName: { [Op.like]: s } },
        { Email: { [Op.like]: s } },
        { Phone: { [Op.like]: s } },
        { CompanyName: { [Op.like]: s } },
        { CustomerCode: { [Op.like]: s } }
      ]
    });
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const { count, rows } = await Customer.findAndCountAll({
    where,
    include: [{ model: User, as: 'owner', attributes: ['UserId', 'Name', 'Email'] }],
    order: [[sortBy, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
    limit: parseInt(limit, 10),
    offset
  });

  return {
    total: count,
    page: parseInt(page, 10),
    totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
    customers: rows
  };
}

async function getCustomerById(user, customerId) {
  const customer = await Customer.findByPk(customerId, {
    include: [
      { model: User, as: 'owner', attributes: ['UserId', 'Name', 'Email'] },
      { model: Opportunity, as: 'opportunities' },
      { model: FollowUp, as: 'followUps' },
      { model: Activity, as: 'activities' }
    ]
  });

  if (!customer) {
    const error = new Error('Customer not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  // Check authorization
  if (user.roleName === 'Sales Executive' && customer.CreatedBy !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to view this customer record.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  return customer;
}

async function createCustomer(user, data, req) {
  const { customerName, email, phone, companyName, address, city, state, status = 'Active', notes } = data;

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone.trim();

  // Check duplicates
  const existingEmail = await Customer.findOne({ where: { Email: normalizedEmail } });
  if (existingEmail) {
    const error = new Error('A customer with this email address already exists.');
    error.status = 409;
    error.isOperational = true;
    throw error;
  }

  const existingPhone = await Customer.findOne({ where: { Phone: normalizedPhone } });
  if (existingPhone) {
    const error = new Error('A customer with this phone number already exists.');
    error.status = 409;
    error.isOperational = true;
    throw error;
  }

  // Prevent duplicate customer by Name & Company
  if (companyName) {
    const duplicateCompanyCustomer = await Customer.findOne({
      where: {
        CustomerName: customerName.trim(),
        CompanyName: companyName.trim()
      }
    });
    if (duplicateCompanyCustomer) {
      const error = new Error(`A customer "${customerName}" already exists for company "${companyName}". Duplicate customer creation prevented.`);
      error.status = 409;
      error.isOperational = true;
      throw error;
    }
  }

  // Generate unique code
  const lastCustomer = await Customer.findOne({ order: [['CustomerId', 'DESC']] });
  const nextNum = (lastCustomer?.CustomerId || 0) + 1001;
  const customerCode = `CUST-${nextNum}`;

  const newCustomer = await Customer.create({
    CustomerCode: customerCode,
    CustomerName: customerName.trim(),
    Email: normalizedEmail,
    Phone: normalizedPhone,
    CompanyName: companyName ? companyName.trim() : null,
    Address: address || null,
    City: city || null,
    State: state || null,
    Status: status,
    Notes: notes || null,
    CreatedBy: data.createdBy || user.userId
  });

  await logAudit({
    userId: user.userId,
    action: 'CREATE',
    entityName: 'Customer',
    recordId: newCustomer.CustomerId,
    oldValue: null,
    newValue: newCustomer.toJSON(),
    req
  });

  return newCustomer;
}

async function updateCustomer(user, customerId, data, req) {
  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    const error = new Error('Customer not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  if (user.roleName === 'Sales Executive' && customer.CreatedBy !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to update this customer.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  // Check unique constraints against other records
  if (data.email) {
    const emailNorm = data.email.toLowerCase().trim();
    const existing = await Customer.findOne({
      where: {
        Email: emailNorm,
        CustomerId: { [Op.ne]: customerId }
      }
    });
    if (existing) {
      const error = new Error('Another customer already exists with this email address.');
      error.status = 409;
      error.isOperational = true;
      throw error;
    }
    customer.Email = emailNorm;
  }

  if (data.phone) {
    const phoneNorm = data.phone.trim();
    const existing = await Customer.findOne({
      where: {
        Phone: phoneNorm,
        CustomerId: { [Op.ne]: customerId }
      }
    });
    if (existing) {
      const error = new Error('Another customer already exists with this phone number.');
      error.status = 409;
      error.isOperational = true;
      throw error;
    }
    customer.Phone = phoneNorm;
  }

  const oldValues = customer.toJSON();

  if (data.customerName) customer.CustomerName = data.customerName.trim();
  if (data.companyName !== undefined) customer.CompanyName = data.companyName ? data.companyName.trim() : null;
  if (data.address !== undefined) customer.Address = data.address;
  if (data.city !== undefined) customer.City = data.city;
  if (data.state !== undefined) customer.State = data.state;
  if (data.status !== undefined) customer.Status = data.status;
  if (data.notes !== undefined) customer.Notes = data.notes;
  if (data.createdBy && (user.roleName === 'Admin' || user.roleName === 'Manager')) {
    customer.CreatedBy = data.createdBy;
  }

  await customer.save();

  await logAudit({
    userId: user.userId,
    action: 'UPDATE',
    entityName: 'Customer',
    recordId: customer.CustomerId,
    oldValue: oldValues,
    newValue: customer.toJSON(),
    req
  });

  return customer;
}

async function deleteCustomer(user, customerId, req) {
  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    const error = new Error('Customer not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  if (user.roleName === 'Sales Executive' && customer.CreatedBy !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to delete or deactivate this customer.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  const oldData = customer.toJSON();

  // Soft deactivation or hard delete. Deactivation is best practice for enterprise CRM, but we also support deletion.
  customer.Status = 'Inactive';
  await customer.save();

  await logAudit({
    userId: user.userId,
    action: 'DELETE',
    entityName: 'Customer',
    recordId: customer.CustomerId,
    oldValue: oldData,
    newValue: { Status: 'Inactive', action: 'Customer deactivated' },
    req
  });

  return { message: 'Customer successfully deactivated.', customer };
}

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
