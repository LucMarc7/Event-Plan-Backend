const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const upload = require('../middleware/upload'); // réutiliser le middleware existant
const userController = require('../controllers/userController');

// Toutes les routes nécessitent authentification
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', upload.single('avatar'), userController.updateProfile);
router.put('/change-password', userController.changePassword);


module.exports = router;