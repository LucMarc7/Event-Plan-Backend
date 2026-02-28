const { User, Event, Order, Comment } = require('../models');
const bcrypt = require('bcrypt');

// Obtenir tous les utilisateurs (avec pagination et filtres)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role, active } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (role) where.role = role;
    if (active !== undefined) where.active = active === 'true';
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
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
};

// Obtenir un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Créer un utilisateur (par admin)
exports.createUser = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, phone, city, country, birthDate, active } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    const user = await User.create({
      email,
      password, // sera hashé par le hook
      role: role || 'buyer',
      firstName,
      lastName,
      phone,
      city,
      country,
      birthDate,
      active: active !== undefined ? active : true
    });
    const userData = user.toJSON();
    delete userData.password;
    res.status(201).json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un utilisateur (admin)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { email, password, role, firstName, lastName, phone, city, country, birthDate, active } = req.body;

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ error: 'Email already in use' });
      user.email = email;
    }
    if (password) user.password = password; // sera hashé
    if (role) user.role = role;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (city !== undefined) user.city = city;
    if (country !== undefined) user.country = country;
    if (birthDate !== undefined) user.birthDate = birthDate;
    if (active !== undefined) user.active = active;

    await user.save();
    const userData = user.toJSON();
    delete userData.password;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un utilisateur (admin) - avec vérification des dépendances
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        { model: Event, as: 'events' },
        { model: Order, as: 'orders' },
        { model: Comment, as: 'comments' }
      ]
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Vérifier s'il a des données associées
    if (user.events.length > 0 || user.orders.length > 0 || user.comments.length > 0) {
      return res.status(400).json({ error: 'Cannot delete user with associated events, orders, or comments' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Activer/désactiver un utilisateur
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.active = !user.active;
    await user.save();
    res.json({ message: `User ${user.active ? 'activated' : 'deactivated'}`, active: user.active });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Réinitialiser le mot de passe (admin définit un nouveau mot de passe)
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};