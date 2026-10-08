const { body } = require('express-validator');

const leadValidation = [
  body('leadName')
    .trim()
    .notEmpty().withMessage('Lead name is required.')
    .isLength({ min: 2, max: 150 }).withMessage('Lead name cannot exceed 150 characters.'),
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
  body('status')
    .notEmpty().withMessage('Lead status is mandatory.')
    .isIn(['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'])
    .withMessage('Status must be one of: New, Contacted, Qualified, Unqualified, Converted, Lost.'),
  body('expectedValue')
    .notEmpty().withMessage('Expected value is required.')
    .isFloat({ min: 0 }).withMessage('Expected value must be a valid number greater than or equal to 0.'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High.')
];

module.exports = { leadValidation };
