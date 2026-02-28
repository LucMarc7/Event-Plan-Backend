const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  buyer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
  type: DataTypes.ENUM('pending', 'paid', 'cancelled', 'refunded'),
  defaultValue: 'pending'
},
  payment_intent_id: DataTypes.STRING,
  buyer_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  buyer_phone: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Order;