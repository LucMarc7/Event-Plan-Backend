const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const superAdminOnly = require('../middleware/superadmin');
const { User, Event, Order, Comment, OrderItem, AccessCategory, Setting, AuditLog, sequelize, BlogPost, Media } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const logAudit = require('../middleware/audit');
const fs = require('fs');

// Toutes les routes nécessitent authentification + rôle admin
router.use(authenticate, adminOnly);

// ==================== GESTION DES UTILISATEURS (superadmin uniquement) ====================

// Liste paginée des utilisateurs avec recherche et filtre par rôle
router.get('/users', superAdminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role, active } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (role) {
      const roles = role.split(',');
      where.role = { [Op.in]: roles };
    }
    if (active !== undefined) {
      where.active = active === 'true';
    }
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      total: users.count,
      pages: Math.ceil(users.count / limit),
      currentPage: parseInt(page),
      data: users.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer un utilisateur par ID
router.get('/users/:id', superAdminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un nouvel utilisateur (admin ou superadmin) – avec audit
router.post('/users', superAdminOnly, logAudit('create_user', 'user'), async (req, res) => {
  const { email, password, name, phone, city, country, birth_date, role, category, active } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    const user = await User.create({
      email,
      password,
      name,
      phone,
      city,
      country,
      birth_date,
      role: role || 'buyer',
      category,
      active: active !== undefined ? active : true
    });

    const userData = user.toJSON();
    delete userData.password;
    res.status(201).json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour un utilisateur (tous les champs sauf mot de passe) – avec audit
router.put('/users/:id', superAdminOnly, logAudit('update_user', 'user'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const { email, name, phone, city, country, birth_date, role, category, active } = req.body;

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Email déjà utilisé' });
      }
    }

    await user.update({
      email: email || user.email,
      name: name !== undefined ? name : user.name,
      phone: phone !== undefined ? phone : user.phone,
      city: city !== undefined ? city : user.city,
      country: country !== undefined ? country : user.country,
      birth_date: birth_date !== undefined ? birth_date : user.birth_date,
      role: role || user.role,
      category: category !== undefined ? category : user.category,
      active: active !== undefined ? active : user.active
    });

    const userData = user.toJSON();
    delete userData.password;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Changer le mot de passe d'un utilisateur – avec audit
router.put('/users/:id/password', superAdminOnly, logAudit('change_password', 'user'), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.password = password;
    await user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activer/désactiver un utilisateur – avec audit
router.put('/users/:id/toggle', superAdminOnly, logAudit('toggle_user', 'user'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.active = !user.active;
    await user.save();

    res.json({
      message: `Utilisateur ${user.active ? 'activé' : 'désactivé'}`,
      active: user.active
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un utilisateur (avec vérification des dépendances) – avec audit
router.delete('/users/:id', superAdminOnly, logAudit('delete_user', 'user'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        { model: Event, as: 'events' },
        { model: Order, as: 'orders' },
        { model: Comment, as: 'comments' }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (user.events.length > 0 || user.orders.length > 0 || user.comments.length > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer un utilisateur avec des événements, commandes ou commentaires associés'
      });
    }

    await user.destroy();
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== GESTION DES ÉVÉNEMENTS ====================

router.get('/events', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, sellerId, startDate, endDate, featured } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (sellerId) where.seller_id = sellerId;
    if (featured !== undefined) where.featured = featured === 'true';
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const events = await Event.findAndCountAll({
      where,
      include: [
        { model: User, as: 'seller', attributes: ['id', 'email', 'name'] },
        { model: AccessCategory, as: 'categories' }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']]
    });

    res.json({
      total: events.count,
      pages: Math.ceil(events.count / limit),
      currentPage: parseInt(page),
      data: events.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modifier le statut d'un événement – avec audit
router.put('/events/:id/status', logAudit('update_event_status', 'event'), async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['draft', 'published', 'paused', 'cancelled', 'completed'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    event.status = status;
    await event.save();

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre en avant ou non un événement – avec audit
router.put('/events/:id/featured', logAudit('update_event_featured', 'event'), async (req, res) => {
  const { featured } = req.body;
  if (typeof featured !== 'boolean') {
    return res.status(400).json({ error: 'La valeur featured doit être un booléen' });
  }

  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    event.featured = featured;
    await event.save();

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un événement – avec audit
router.delete('/events/:id', logAudit('delete_event', 'event'), async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    await event.destroy();
    res.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistiques détaillées d'un événement
router.get('/events/:id/stats', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: AccessCategory, as: 'categories' },
        { model: Order, as: 'orders', where: { status: 'paid' }, required: false, include: ['items'] }
      ]
    });

    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    const totalSold = event.categories.reduce((acc, cat) => acc + cat.quantity_sold, 0);
    const totalRevenue = event.orders.reduce((acc, order) => acc + parseFloat(order.total_amount), 0);
    const totalCommission = event.categories.reduce(
      (acc, cat) => acc + (cat.quantity_sold * cat.price * cat.commission_rate / 100),
      0
    );

    res.json({
      totalSold,
      totalRevenue,
      totalCommission,
      netRevenue: totalRevenue - totalCommission,
      ordersCount: event.orders.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exporter la liste des participants d'un événement (CSV)
router.get('/events/:id/participants/export', async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { event_id: req.params.id, status: 'paid' },
      include: [
        { model: User, as: 'buyer', attributes: ['email'] },
        { model: OrderItem, as: 'items', include: ['category'] }
      ]
    });

    const participants = orders.flatMap(order =>
      order.items.map(item => ({
        email: order.buyer.email,
        name: order.buyer_name || '',
        phone: order.buyer_phone || '',
        quantity: item.quantity,
        category: item.category.name,
        unitPrice: item.unit_price
      }))
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=event-${req.params.id}-participants.csv`);
    res.write('Email,Nom,Téléphone,Catégorie,Quantité,Prix unitaire\n');
    participants.forEach(p => {
      res.write(`"${p.email}","${p.name}","${p.phone}","${p.category}",${p.quantity},${p.unitPrice}\n`);
    });
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== GESTION DES COMMENTAIRES (superadmin uniquement) ====================

// GET /admin/comments - Liste paginée avec enrichissement
router.get('/comments', superAdminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Comment.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] }]
    });

    // Enrichir avec les détails de la cible (Event ou BlogPost)
    const enriched = await Promise.all(rows.map(async (comment) => {
      let target = null;
      if (comment.target_type === 'Event') {
        target = await Event.findByPk(comment.target_id, { attributes: ['id', 'title'] });
      } else if (comment.target_type === 'BlogPost') {
        target = await BlogPost.findByPk(comment.target_id, { attributes: ['id', 'title'] });
      }
      return { ...comment.toJSON(), target };
    }));

    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: enriched
    });
  } catch (error) {
    console.error('Erreur GET /admin/comments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Masquer/afficher un commentaire – avec audit
router.put('/comments/:id/hide', superAdminOnly, logAudit('toggle_comment_hidden', 'comment'), async (req, res) => {
  const { hidden } = req.body;
  if (typeof hidden !== 'boolean') {
    return res.status(400).json({ error: 'La valeur hidden doit être un booléen' });
  }

  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    comment.hidden = hidden;
    await comment.save();

    res.json({ hidden: comment.hidden });
  } catch (error) {
    console.error('Erreur toggle hidden:', error);
    res.status(500).json({ error: error.message });
  }
});

// Marquer comme vedette / retirer des vedettes – avec audit
router.put('/comments/:id/featured', superAdminOnly, logAudit('toggle_comment_featured', 'comment'), async (req, res) => {
  const { featured } = req.body;
  if (typeof featured !== 'boolean') {
    return res.status(400).json({ error: 'La valeur featured doit être un booléen' });
  }

  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    comment.featured = featured;
    await comment.save();

    res.json({ featured: comment.featured });
  } catch (error) {
    console.error('Erreur toggle featured:', error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer définitivement un commentaire – avec audit
router.delete('/comments/:id', superAdminOnly, logAudit('delete_comment', 'comment'), async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    await comment.destroy();
    res.json({ message: 'Commentaire supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression commentaire:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== GESTION DES TRANSACTIONS ====================

router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const orders = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'email', 'name'] },
        { model: Event, as: 'event', attributes: ['id', 'title'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      total: orders.count,
      pages: Math.ceil(orders.count / limit),
      currentPage: parseInt(page),
      data: orders.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transactions/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'email', 'name'] },
        { model: Event, as: 'event', attributes: ['id', 'title'] },
        { model: OrderItem, as: 'items', include: ['category'] }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rembourser une commande – avec audit
router.put('/transactions/:id/refund', logAudit('refund_order', 'order'), async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.status !== 'paid') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Seules les commandes payées peuvent être remboursées' });
    }

    for (const item of order.items) {
      const category = await AccessCategory.findByPk(item.access_category_id, { transaction });
      category.quantity_sold -= item.quantity;
      await category.save({ transaction });
    }

    order.status = 'refunded';
    await order.save({ transaction });

    await transaction.commit();
    res.json({ message: 'Commande remboursée avec succès' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATISTIQUES DASHBOARD ====================

router.get('/stats', async (req, res) => {
  try {
    const totalEvents = await Event.count();
    const totalUsers = await User.count();
    const totalOrders = await Order.count();
    const totalRevenue = (await Order.sum('total_amount', { where: { status: 'paid' } })) || 0;
    const totalPendingOrders = await Order.count({ where: { status: 'pending' } });

    res.json({
      totalEvents,
      totalUsers,
      totalOrders,
      totalRevenue,
      totalPendingOrders
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATISTIQUES AVANCÉES ====================
router.get('/stats/advanced', async (req, res) => {
  try {
    // Ventes par mois (12 derniers mois)
    const monthlySales = await Order.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('sum', sequelize.col('total_amount')), 'total']
      ],
      where: {
        status: 'paid',
        createdAt: { [Op.gte]: sequelize.literal("NOW() - INTERVAL '12 months'") }
      },
      group: ['month'],
      order: [[sequelize.col('month'), 'ASC']]
    });

    // Inscriptions par mois
    const monthlyRegistrations = await User.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: { [Op.gte]: sequelize.literal("NOW() - INTERVAL '12 months'") }
      },
      group: ['month'],
      order: [[sequelize.col('month'), 'ASC']]
    });

    // Événements créés par mois
    const monthlyEvents = await Event.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: { [Op.gte]: sequelize.literal("NOW() - INTERVAL '12 months'") }
      },
      group: ['month'],
      order: [[sequelize.col('month'), 'ASC']]
    });

    res.json({
      monthlySales,
      monthlyRegistrations,
      monthlyEvents
    });
  } catch (error) {
    console.error('Erreur stats avancées:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export CSV des utilisateurs
router.get('/users/export', superAdminOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.write('ID,Email,Nom,Téléphone,Ville,Pays,Rôle,Date création\n');
    users.forEach(u => {
      res.write(`${u.id},"${u.email}","${u.name || ''}","${u.phone || ''}","${u.city || ''}","${u.country || ''}",${u.role},${new Date(u.createdAt).toLocaleDateString()}\n`);
    });
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUDIT LOGS ====================
router.get('/logs', superAdminOnly, async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{ model: User, as: 'admin', attributes: ['email'] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PARAMÈTRES ====================
router.get('/settings', async (req, res) => {
  try {
    const settings = await Setting.findAll({ order: [['key', 'ASC']] });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings/:key', logAudit('update_setting', 'setting'), async (req, res) => {
  const { value } = req.body;
  try {
    const setting = await Setting.findOne({ where: { key: req.params.key } });
    if (!setting) return res.status(404).json({ error: 'Paramètre non trouvé' });

    // Valider selon le type
    if (setting.type === 'number' && isNaN(parseFloat(value))) {
      return res.status(400).json({ error: 'La valeur doit être un nombre' });
    }
    if (setting.type === 'json') {
      try {
        JSON.parse(value);
      } catch (e) {
        return res.status(400).json({ error: 'La valeur doit être un JSON valide' });
      }
    }

    setting.value = value;
    await setting.save();
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== GESTION DES MÉDIAS ====================
router.get('/media', async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (type) where.related_type = type;

    const media = await Media.findAndCountAll({
      where,
      include: [{ model: User, as: 'uploader', attributes: ['id', 'email'] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    res.json({
      total: media.count,
      pages: Math.ceil(media.count / limit),
      currentPage: parseInt(page),
      data: media.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/media/:id', async (req, res) => {
  try {
    const media = await Media.findByPk(req.params.id);
    if (!media) return res.status(404).json({ error: 'Média non trouvé' });
    // Supprimer le fichier physique
    if (fs.existsSync(media.path)) {
      fs.unlinkSync(media.path);
    }
    await media.destroy();
    res.json({ message: 'Média supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;