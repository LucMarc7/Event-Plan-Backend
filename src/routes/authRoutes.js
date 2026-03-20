const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const upload = require('../middleware/upload');

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

// Routes protégées (authentification requise)
router.use(authenticate);

// Profil
router.get('/profile', userController.getProfile);
router.put('/profile', express.json(), userController.updateProfile);

// Avatar
router.put('/profile/avatar', upload.single('avatar'), userController.updateAvatar);

// Changement de mot de passe
router.put('/change-password', userController.changePassword);

module.exports = router;