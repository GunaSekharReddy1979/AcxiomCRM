const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Opportunity = sequelize.define('Opportunity', {
  OpportunityId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  OpportunityName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 150]
    }
  },
  CustomerId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  LeadId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  Stage: {
    type: DataTypes.ENUM('Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'),
    defaultValue: 'Qualification'
  },
  Probability: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
    validate: {
      min: 0,
      max: 100
    }
  },
  ExpectedCloseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  Status: {
    type: DataTypes.ENUM('Open', 'Won', 'Lost'),
    defaultValue: 'Open'
  },
  AssignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  CreatedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Opportunities',
  timestamps: true
});

module.exports = Opportunity;
