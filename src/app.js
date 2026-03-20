const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const sequelize = require('./config/database');
const { sequelize: syncDb } = require('./models');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Sécurité - configuration modifiée pour autoriser cross-origin sur les ressources
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de log (doit être placé avant les routes)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Requête reçue: ${req.method} ${req.url}`);
  next();
});

// Servir les fichiers uploadés (ajustez le chemin si besoin)
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Connexion DB
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });

// Synchronisation et initialisation (inchangé)
async function syncAndInit() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      await syncDb.sync({ alter: true });
      console.log('✅ Database synced (development)');
    } else {
      await syncDb.sync();
      console.log('✅ Database synced (production)');
    }

    const { Setting } = require('./models');
    const defaults = [
      { key: 'site_name', value: 'Event Plan', type: 'string' },
      { key: 'commission_standard', value: '10', type: 'number' },
      { key: 'commission_vip', value: '15', type: 'number' },
      { key: 'payment_methods', value: JSON.stringify(['OM', 'AM', 'MP', 'AF']), type: 'json' }
    ];
    for (const def of defaults) {
      await Setting.findOrCreate({ where: { key: def.key }, defaults: def });
    }
    console.log('✅ Default settings initialized');
  } catch (err) {
    console.error('❌ Error during sync/init:', err);
    process.exit(1);
  }
}

syncAndInit().then(() => {
  // Routes API
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/events', require('./routes/eventRoutes'));
  app.use('/api/orders', require('./routes/orderRoutes'));
  app.use('/api/payments', require('./routes/paymentRoutes'));
  app.use('/api/comments', require('./routes/commentRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  app.use('/api/users', require('./routes/userRoutes'));

  // Servir l'application d'administration (SPA)
  app.use('/admin', express.static(path.join(__dirname, '../admin/dist')));
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/dist/index.html'));
  });

  // Route de base
  app.get('/', (req, res) => {
    res.send('Event Plan API is running');
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});