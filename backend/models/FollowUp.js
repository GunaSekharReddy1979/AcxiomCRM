const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FollowUp = sequelize.define('FollowUp', {
  FollowUpId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  CustomerId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  LeadId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Subject: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  FollowUpDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  FollowUpType: {
    type: DataTypes.ENUM('Call', 'Meeting', 'Email', 'Task'),
    defaultValue: 'Call'
  },
  Remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  Status: {
    type: DataTypes.ENUM('Planned', 'Completed', 'Missed', 'Cancelled'),
    defaultValue: 'Planned'
  },
  AssignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  CompletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'FollowUps',
  timestamps: true
});

module.exports = FollowUp;
