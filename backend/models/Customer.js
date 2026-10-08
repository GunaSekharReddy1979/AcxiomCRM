const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Customer = sequelize.define('Customer', {
  CustomerId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  CustomerCode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  CustomerName: {
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
    unique: true,
    validate: {
      isEmail: true
    }
  },
  Phone: {
    type: DataTypes.STRING(25),
    allowNull: false,
    unique: true
  },
  CompanyName: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  Address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  City: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  State: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  Status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  },
  Notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  CreatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  CreatedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Customers',
  timestamps: true
});

module.exports = Customer;
