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
    defaultValue: 'Event'
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  author_id: {                     // <-- utilisez author_id, pas user_id
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
};

module.exports = Comment;