const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticate = require('../middleware/auth');

router.use(authenticate);
router.get('/:id/tickets', authenticate, orderController.getOrderTickets);
router.post('/', orderController.createOrder);
router.get('/me', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id', orderController.updateOrder); // Pour mettre à jour nom/téléphone
router.get('/:id/ticket', authenticate, orderController.downloadTicket);


module.exports = router;