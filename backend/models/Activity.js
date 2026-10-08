const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Activity = sequelize.define('Activity', {
  ActivityId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ActivityType: {
    type: DataTypes.ENUM('Call', 'Meeting', 'Email', 'Task'),
    allowNull: false
  },
  Subject: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ActivityDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  CustomerId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  LeadId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  AssignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Status: {
    type: DataTypes.ENUM('Completed', 'Pending', 'In Progress'),
    defaultValue: 'Completed'
  }
}, {
  tableName: 'Activities',
  timestamps: true
});

module.exports = Activity;
