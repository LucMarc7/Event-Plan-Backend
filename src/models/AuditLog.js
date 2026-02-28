const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  target_type: {
    type: DataTypes.STRING, // 'user', 'event', 'order', etc.
    allowNull: false
  },
  target_id: {
    type: DataTypes.INTEGER
  },
  details: {
    type: DataTypes.TEXT
  },
  ip_address: {
    type: DataTypes.STRING
  }
});

module.exports = AuditLog;