const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Accès interdit. Réservé aux administrateurs.' });
  }
  next();
};

module.exports = adminOnly;