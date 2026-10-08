const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  AuditLogId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  UserId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  EntityName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  RecordId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  OldValue: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  NewValue: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  IpAddress: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  CreatedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'AuditLogs',
  timestamps: false
});

module.exports = AuditLog;
