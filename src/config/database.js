const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Indispensable pour Render
    }
  },
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;