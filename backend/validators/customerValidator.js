const { body } = require('express-validator');

const customerValidation = [
  body('customerName')
    .trim()
    .notEmpty().withMessage('Customer Name is required.')
    .isLength({ min: 2, max: 150 }).withMessage('Customer Name cannot exceed 150 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/)
    .withMessage('Enter a valid phone number.'),
  body('companyName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 }).withMessage('Company Name cannot exceed 150 characters.'),
  body('city')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('City cannot exceed 100 characters.'),
  body('state')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('State cannot exceed 100 characters.'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive']).withMessage('Status must be either Active or Inactive.')
];

module.exports = { customerValidation };
