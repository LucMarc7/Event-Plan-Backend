const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authenticate = require('../middleware/auth');

router.get('/me', authenticate, ticketController.getUserTickets);
router.get('/:id/qr', authenticate, ticketController.getTicketQRCode);
router.post('/validate', ticketController.validateTicket); // publique ou protégée selon besoin

module.exports = router;