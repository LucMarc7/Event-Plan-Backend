const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authenticate = require('../middleware/auth');
const upload = require('../middleware/uploadAvatar');

router.use(authenticate); // Toutes les routes nécessitent une authentification

router.get('/', profileController.getProfile);
router.put('/', upload.single('avatar'), profileController.updateProfile);
router.put('/password', profileController.changePassword);

module.exports = router;