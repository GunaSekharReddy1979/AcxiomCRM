const { body } = require('express-validator');

const activityValidation = [
  body('activityType')
    .notEmpty().withMessage('Activity type is required.')
    .isIn(['Call', 'Meeting', 'Email', 'Task'])
    .withMessage('Activity type must be Call, Meeting, Email, or Task.'),
  body('subject')
    .trim()
    .notEmpty().withMessage('Activity subject is required.')
    .isLength({ min: 2, max: 200 }).withMessage('Subject must be between 2 and 200 characters.'),
  body('status')
    .optional()
    .isIn(['Completed', 'Pending', 'In Progress'])
    .withMessage('Status must be Completed, Pending, or In Progress.')
];

module.exports = { activityValidation };
