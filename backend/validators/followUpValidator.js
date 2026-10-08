const { body } = require('express-validator');

const followUpValidation = [
  body('subject')
    .trim()
    .notEmpty().withMessage('Follow-up subject is required.')
    .isLength({ min: 2, max: 200 }).withMessage('Subject must be between 2 and 200 characters.'),
  body('followUpDate')
    .notEmpty().withMessage('Follow-up date and time is required.')
    .isISO8601().withMessage('Follow-up date must be a valid date/time.')
    .custom((val, { req }) => {
      // For new / planned follow-ups, date cannot be earlier than today
      const status = req.body.status || 'Planned';
      if (status === 'Planned') {
        const targetDate = new Date(val);
        const now = new Date();
        // Give a generous 5-minute buffer for client-server clock drift if scheduled for right now
        now.setMinutes(now.getMinutes() - 5);
        if (targetDate < now) {
          throw new Error('Follow-up date cannot be earlier than today.');
        }
      }
      return true;
    }),
  body('followUpType')
    .optional()
    .isIn(['Call', 'Meeting', 'Email', 'Task'])
    .withMessage('Follow-up type must be Call, Meeting, Email, or Task.'),
  body('status')
    .optional()
    .isIn(['Planned', 'Completed', 'Missed', 'Cancelled'])
    .withMessage('Status must be Planned, Completed, Missed, or Cancelled.')
];

module.exports = { followUpValidation };
