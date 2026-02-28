const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: DataTypes.TEXT,
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  location: DataTypes.STRING,
  total_access: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'paused', 'cancelled', 'completed'),
    defaultValue: 'draft'
  },
  featured: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},
  image_url: DataTypes.STRING
});

module.exports = Event;