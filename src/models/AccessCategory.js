const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AccessCategory = sequelize.define('AccessCategory', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  commission_rate: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 100 }
  },
  quantity_total: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0 }
  },
  quantity_sold: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  }
});

module.exports = AccessCategory;