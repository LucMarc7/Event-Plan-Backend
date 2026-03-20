const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController'); // Import du contrôleur utilisateur
const authenticate = require('../middleware/auth'); // Middleware d'authentification
const upload = require('../middleware/upload'); // Middleware pour les fichiers

// Routes publiques
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe doit contenir au moins 6 caractères'),
    body('name').optional().isString().trim(),
    body('phone').optional().matches(/^[0-9]+$/).withMessage('Téléphone invalide'),
    body('city').optional().isString().trim(),
    body('country').optional().isString().trim(),
    body('birth_date').optional().isDate().withMessage('Date de naissance invalide'),
    body('role').optional().isIn(['buyer', 'seller']),
    body('category').optional().isIn(['organizer', 'artist', 'enterprise', 'manager', 'coach', 'favorite'])
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  authController.login
);

// Routes protégées pour le profil utilisateur (ajoutées pour répondre à l'appel /api/auth/profile)
router.use(authenticate); // Toutes les routes suivantes nécessitent un token valide

router.get('/profile', userController.getProfile);
router.put('/profile', upload.single('avatar'), userController.updateProfile);
router.put('/change-password', userController.changePassword);

module.exports = router;