const superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Accès interdit. Réservé au super administrateur.' });
  }
  next();
};

module.exports = superAdminOnly;