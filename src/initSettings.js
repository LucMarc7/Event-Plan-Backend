const { Setting } = require('./models');

const defaultSettings = [
  { key: 'site_name', value: 'Event Plan', type: 'string', description: 'Nom du site affiché' },
  { key: 'commission_standard', value: '10', type: 'number', description: 'Commission pour les billets standard (en %)' },
  { key: 'commission_vip', value: '15', type: 'number', description: 'Commission pour les billets VIP (en %)' },
  { key: 'payment_methods', value: JSON.stringify(['OM', 'AM', 'MP', 'AF']), type: 'json', description: 'Moyens de paiement activés' },
  { key: 'contact_email', value: 'contact@eventplan.cd', type: 'string', description: 'Email de contact' },
];

const initSettings = async () => {
  for (const def of defaultSettings) {
    await Setting.findOrCreate({ 
      where: { key: def.key }, 
      defaults: def 
    });
  }
  console.log('✅ Paramètres initialisés');
};

module.exports = initSettings;