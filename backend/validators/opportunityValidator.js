const { body } = require('express-validator');

const opportunityValidation = [
  body('opportunityName')
    .trim()
    .notEmpty().withMessage('Opportunity Name is required.')
    .isLength({ min: 2, max: 150 }).withMessage('Opportunity Name cannot exceed 150 characters.'),
  body('amount')
    .notEmpty().withMessage('Opportunity Amount is required.')
    .isFloat().withMessage('Opportunity Amount must be a valid number.')
    .custom((val, { req }) => {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) {
        throw new Error('Opportunity Amount must be greater than 0.');
      }
      return true;
    }),
  body('probability')
    .notEmpty().withMessage('Probability is required.')
    .isInt().withMessage('Probability must be an integer.')
    .custom(val => {
      const num = parseInt(val, 10);
      if (num < 0 || num > 100) {
        throw new Error('Probability must be between 0 and 100.');
      }
      return true;
    }),
  body('expectedCloseDate')
    .notEmpty().withMessage('Expected Close Date is required.')
    .isISO8601().withMessage('Expected Close Date must be a valid date.')
    .custom((val, { req }) => {
      // For active opportunities (status not Won/Lost or stage not Lost)
      const stage = req.body.stage;
      if (stage !== 'Lost' && stage !== 'Won') {
        const targetDate = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        if (targetDate < today) {
          throw new Error('Expected Close Date cannot be in the past.');
        }
      }
      return true;
    }),
  body('stage')
    .optional()
    .isIn(['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'])
    .withMessage('Stage must be one of: Qualification, Proposal, Negotiation, Won, Lost.')
];

module.exports = { opportunityValidation };
