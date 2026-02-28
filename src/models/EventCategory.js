const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventCategory = sequelize.define('EventCategory', {
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = EventCategory;