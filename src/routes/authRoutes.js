const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

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

module.exports = router;