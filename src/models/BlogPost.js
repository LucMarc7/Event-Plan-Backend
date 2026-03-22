const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BlogPost = sequelize.define('BlogPost', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  excerpt: DataTypes.TEXT,
  featured_image: DataTypes.STRING,
  published_at: DataTypes.DATE,
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

BlogPost.associate = (models) => {
  BlogPost.belongsTo(models.User, { as: 'author', foreignKey: 'author_id' });
  BlogPost.hasMany(models.BlogComment, { as: 'comments', foreignKey: 'post_id' });
};

module.exports = BlogPost;