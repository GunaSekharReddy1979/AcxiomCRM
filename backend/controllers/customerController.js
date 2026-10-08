const customerService = require('../services/customerService');

async function getCustomers(req, res, next) {
  try {
    const result = await customerService.getCustomers(req.user, req.query);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function getCustomerById(req, res, next) {
  try {
    const customer = await customerService.getCustomerById(req.user, req.params.id);
    return res.status(200).json({
      success: true,
      data: customer
    });
  } catch (err) {
    next(err);
  }
}

async function createCustomer(req, res, next) {
  try {
    const customer = await customerService.createCustomer(req.user, req.body, req);
    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: customer
    });
  } catch (err) {
    next(err);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const customer = await customerService.updateCustomer(req.user, req.params.id, req.body, req);
    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully.',
      data: customer
    });
  } catch (err) {
    next(err);
  }
}

async function deleteCustomer(req, res, next) {
  try {
    const result = await customerService.deleteCustomer(req.user, req.params.id, req);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.customer
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
