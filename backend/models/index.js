const sequelize = require('../config/db');
const Role = require('./Role');
const User = require('./User');
const Customer = require('./Customer');
const Lead = require('./Lead');
const Opportunity = require('./Opportunity');
const FollowUp = require('./FollowUp');
const Activity = require('./Activity');
const AuditLog = require('./AuditLog');

// Role <-> User
Role.hasMany(User, { foreignKey: 'RoleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'RoleId', as: 'role' });

// User <-> Customer (Owner / CreatedBy)
User.hasMany(Customer, { foreignKey: 'CreatedBy', as: 'customers' });
Customer.belongsTo(User, { foreignKey: 'CreatedBy', as: 'owner' });

// User <-> Lead (AssignedTo)
User.hasMany(Lead, { foreignKey: 'AssignedTo', as: 'leads' });
Lead.belongsTo(User, { foreignKey: 'AssignedTo', as: 'assignedUser' });

// Lead <-> Customer / Opportunity (Conversions)
Lead.belongsTo(Customer, { foreignKey: 'ConvertedCustomerId', as: 'convertedCustomer' });
Lead.belongsTo(Opportunity, { foreignKey: 'ConvertedOpportunityId', as: 'convertedOpportunity' });

// Customer <-> Opportunity
Customer.hasMany(Opportunity, { foreignKey: 'CustomerId', as: 'opportunities' });
Opportunity.belongsTo(Customer, { foreignKey: 'CustomerId', as: 'customer' });

// Lead <-> Opportunity
Lead.hasMany(Opportunity, { foreignKey: 'LeadId', as: 'opportunities' });
Opportunity.belongsTo(Lead, { foreignKey: 'LeadId', as: 'lead' });

// User <-> Opportunity
User.hasMany(Opportunity, { foreignKey: 'AssignedTo', as: 'opportunities' });
Opportunity.belongsTo(User, { foreignKey: 'AssignedTo', as: 'assignedUser' });

// FollowUp associations
Customer.hasMany(FollowUp, { foreignKey: 'CustomerId', as: 'followUps' });
FollowUp.belongsTo(Customer, { foreignKey: 'CustomerId', as: 'customer' });

Lead.hasMany(FollowUp, { foreignKey: 'LeadId', as: 'followUps' });
FollowUp.belongsTo(Lead, { foreignKey: 'LeadId', as: 'lead' });

User.hasMany(FollowUp, { foreignKey: 'AssignedTo', as: 'followUps' });
FollowUp.belongsTo(User, { foreignKey: 'AssignedTo', as: 'assignedUser' });

// Activity associations
Customer.hasMany(Activity, { foreignKey: 'CustomerId', as: 'activities' });
Activity.belongsTo(Customer, { foreignKey: 'CustomerId', as: 'customer' });

Lead.hasMany(Activity, { foreignKey: 'LeadId', as: 'activities' });
Activity.belongsTo(Lead, { foreignKey: 'LeadId', as: 'lead' });

User.hasMany(Activity, { foreignKey: 'AssignedTo', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'AssignedTo', as: 'assignedUser' });

// AuditLog associations
User.hasMany(AuditLog, { foreignKey: 'UserId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'UserId', as: 'user' });

module.exports = {
  sequelize,
  Role,
  User,
  Customer,
  Lead,
  Opportunity,
  FollowUp,
  Activity,
  AuditLog
};
