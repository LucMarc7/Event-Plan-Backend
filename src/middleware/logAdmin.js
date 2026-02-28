const { AdminLog } = require('../models');

const logAdminAction = (action) => async (req, res, next) => {
  // Stocker pour utiliser après la réponse
  res.on('finish', async () => {
    if (res.statusCode < 400) { // seulement si succès
      try {
        await AdminLog.create({
          admin_id: req.user.id,
          action,
          details: JSON.stringify({ method: req.method, url: req.originalUrl, body: req.body, params: req.params }),
          ip_address: req.ip
        });
      } catch (err) {
        console.error('Erreur log admin', err);
      }
    }
  });
  next();
};

module.exports = logAdminAction;