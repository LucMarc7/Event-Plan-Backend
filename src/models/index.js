const sequelize = require('../config/database');

// Importer tous les modèles existants
const Media = require('./Media');
const User = require('./User');
const Event = require('./Event');
const AccessCategory = require('./AccessCategory');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Comment = require('./Comment');
const Ticket = require('./Ticket');
const AdminLog = require('./AdminLog');
const Category = require('./Category');
const EventCategory = require('./EventCategory');
const Coupon = require('./Coupon');
const AuditLog = require('./AuditLog');
const Setting = require('./Setting');

// Nouveaux modèles pour le blog
const BlogPost = require('./BlogPost');
const BlogComment = require('./BlogComment');

// ==================== ASSOCIATIONS EXISTANTES ====================

// Utilisateurs
User.hasMany(Event, { foreignKey: 'seller_id', as: 'events' });
Event.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });

User.hasMany(Order, { foreignKey: 'buyer_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'buyer_id', as: 'buyer' });

// Associations Comment (polymorphes) – mise à jour pour utiliser author_id
User.hasMany(Comment, { foreignKey: 'author_id', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

User.hasMany(AdminLog, { foreignKey: 'admin_id', as: 'logs' });
AdminLog.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

User.hasMany(Ticket, { foreignKey: 'user_id', as: 'tickets' });
Ticket.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AuditLog, { foreignKey: 'admin_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

// Événements
Event.hasMany(AccessCategory, { foreignKey: 'event_id', as: 'categories' });
AccessCategory.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(Order, { foreignKey: 'event_id', as: 'orders' });
Order.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

// Les relations directes Event ↔ Comment sont supprimées (remplacées par le polymorphisme)
// Event.hasMany(Comment, { foreignKey: 'event_id', as: 'comments' });
// Comment.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(Coupon, { foreignKey: 'event_id', as: 'coupons' });
Coupon.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

Event.hasMany(Ticket, { foreignKey: 'event_id', as: 'tickets' });
Ticket.belongsTo(Event, { foreignKey: 'event_id' });

// Catégories thématiques (many-to-many avec Event)
Event.belongsToMany(Category, { through: EventCategory, foreignKey: 'event_id', otherKey: 'category_id', as: 'eventCategories' });
Category.belongsToMany(Event, { through: EventCategory, foreignKey: 'category_id', otherKey: 'event_id', as: 'categoryEvents' });

// Commandes
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Order.hasMany(Ticket, { foreignKey: 'order_id', as: 'tickets' });
Ticket.belongsTo(Order, { foreignKey: 'order_id' });

// Catégories d'accès (billets)
AccessCategory.hasMany(OrderItem, { foreignKey: 'access_category_id', as: 'orderItems' });
OrderItem.belongsTo(AccessCategory, { foreignKey: 'access_category_id', as: 'category' });

// Billets (relation optionnelle avec Category si nécessaire)
Ticket.belongsTo(Category, { foreignKey: 'category_id' });

// ==================== ASSOCIATIONS BLOG ====================

User.hasMany(BlogPost, { foreignKey: 'author_id', as: 'blogPosts' });
BlogPost.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

User.hasMany(BlogComment, { foreignKey: 'author_id', as: 'blogComments' });
BlogComment.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

BlogPost.hasMany(BlogComment, { foreignKey: 'post_id', as: 'comments' });
BlogComment.belongsTo(BlogPost, { foreignKey: 'post_id', as: 'post' });

// ==================== ASSOCIATIONS MEDIA ====================

Media.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
Media.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
User.hasMany(Media, { foreignKey: 'uploaded_by', as: 'media' });
Event.hasMany(Media, { foreignKey: 'event_id', as: 'media' });

// ==================== EXPORT ====================
module.exports = {
  sequelize,
  User,
  Event,
  AccessCategory,
  Order,
  OrderItem,
  Comment,
  Ticket,
  AdminLog,
  Category,
  EventCategory,
  Coupon,
  AuditLog,
  Setting,
  Media,
  BlogPost,
  BlogComment,
};