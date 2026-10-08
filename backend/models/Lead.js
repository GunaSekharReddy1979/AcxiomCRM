const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Lead = sequelize.define('Lead', {
  LeadId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  LeadCode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  LeadName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 150]
    }
  },
  Email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  Phone: {
    type: DataTypes.STRING(25),
    allowNull: false
  },
  CompanyName: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  Source: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Website'
  },
  Status: {
    type: DataTypes.ENUM('New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'),
    defaultValue: 'New'
  },
  Priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium'
  },
  ExpectedValue: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  Notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  AssignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ConvertedCustomerId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ConvertedOpportunityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  CreatedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Leads',
  timestamps: true
});

module.exports = Lead;
