const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  UserId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  PasswordHash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  RoleId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Sales'
  },
  Phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  IsActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  FailedLoginCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  LockoutEnd: {
    type: DataTypes.DATE,
    allowNull: true
  },
  CreatedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Users',
  timestamps: true
});

module.exports = User;
