const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Role = sequelize.define('Role', {
  RoleId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  RoleName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  Description: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'Roles',
  timestamps: false
});

module.exports = Role;
