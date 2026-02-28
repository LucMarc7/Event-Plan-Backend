const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const eventController = require('../controllers/eventController');
const authenticate = require('../middleware/auth');
const upload = require('../middleware/upload');

// Routes publiques
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);

// Routes protégées (nécessitent authentification)
router.use(authenticate);

// Routes pour vendeurs
router.post(
  '/',
  upload.single('image'),
  eventController.createEvent
);

router.get('/seller/me', eventController.getMyEvents);
router.put('/:id/publish', eventController.publishEvent);
router.put('/:id', upload.single('image'), eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);
router.get('/seller/stats', eventController.getSellerStats);
router.post('/', upload.single('image'), eventController.createEvent);

module.exports = router;