const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BlogComment = sequelize.define('BlogComment', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'BlogPosts', key: 'id' }
  },
  author_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

BlogComment.associate = (models) => {
  BlogComment.belongsTo(models.User, { as: 'author', foreignKey: 'author_id' });
  BlogComment.belongsTo(models.BlogPost, { as: 'post', foreignKey: 'post_id' });
};

module.exports = BlogComment;