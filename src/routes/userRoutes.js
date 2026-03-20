const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const upload = require('../middleware/upload');
const userController = require('../controllers/userController');

// Toutes les routes nécessitent authentification
router.use(authenticate);

// Note : les routes /profile sont également disponibles sous /api/auth/profile (dans authRoutes.js)
// Vous pouvez désactiver les lignes ci-dessous si vous voulez un seul point d'entrée.
router.get('/profile', userController.getProfile);
router.put('/profile', upload.single('avatar'), userController.updateProfile);
router.put('/change-password', userController.changePassword);

module.exports = router;