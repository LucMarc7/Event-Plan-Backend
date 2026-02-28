const { AuditLog } = require('../models');

const logAudit = (action, targetType) => {
  return async (req, res, next) => {
    // On intercepte res.json pour enregistrer le log après l'envoi de la réponse
    const originalJson = res.json;
    res.json = function(data) {
      // Restaurer la fonction originale (optionnel, mais par sécurité)
      res.json = originalJson;
      
      // Appeler la fonction originale d'abord pour envoyer la réponse
      const result = originalJson.call(this, data);
      
      // Ensuite, enregistrer le log (en arrière-plan, sans bloquer)
      if (req.user) {
        const targetId = req.params.id || data?.id || null;
        const details = JSON.stringify({ 
          body: req.body, 
          params: req.params, 
          result: data 
        });
        
        AuditLog.create({
          admin_id: req.user.id,
          action,
          target_type: targetType,
          target_id: targetId,
          details,
          ip_address: req.ip
        }).catch(err => console.error('Erreur audit log:', err));
      }
      
      return result;
    };
    next();
  };
};

module.exports = logAudit;