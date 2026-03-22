const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  target_type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Event' // 'Event' ou 'BlogPost'
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  author_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Comment.associate = (models) => {
  Comment.belongsTo(models.User, { as: 'author', foreignKey: 'author_id' });
  // Pas d’association directe avec Event ou BlogPost – géré dynamiquement
};

module.exports = Comment;