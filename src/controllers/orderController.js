const { Order, OrderItem, Event, AccessCategory } = require('../models');
const sequelize = require('../config/database');
const { Ticket } = require('../models');
const ticketService = require('../services/ticketService');

// Créer une commande (acheteur)
exports.createOrder = async (req, res) => {
  const { eventId, items } = req.body;
  const buyerId = req.user.id;

  const transaction = await sequelize.transaction();

  try {
    const event = await Event.findByPk(eventId, {
      include: [{ model: AccessCategory, as: 'categories' }],
      transaction
    });
    if (!event || event.status !== 'published') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Event not available' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const category = event.categories.find(c => c.id === item.categoryId);
      if (!category) {
        await transaction.rollback();
        return res.status(400).json({ error: `Category ${item.categoryId} not found` });
      }
      if (category.quantity_sold + item.quantity > category.quantity_total) {
        await transaction.rollback();
        return res.status(400).json({ error: `Not enough tickets for ${category.name}` });
      }

      const subtotal = category.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        access_category_id: category.id,
        quantity: item.quantity,
        unit_price: category.price,
        commission_rate: category.commission_rate,
        subtotal
      });
    }

    const order = await Order.create({
      buyer_id: buyerId,
      event_id: eventId,
      total_amount: totalAmount,
      status: 'pending'
    }, { transaction });

    for (const item of orderItems) {
      await OrderItem.create({
        ...item,
        order_id: order.id
      }, { transaction });
    }

    await transaction.commit();

    res.status(201).json({ orderId: order.id, totalAmount });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Obtenir une commande par ID (acheteur uniquement)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, buyer_id: req.user.id },
      include: [
        { model: Event, as: 'event', attributes: ['id', 'title', 'date', 'image_url'] },
        { model: OrderItem, as: 'items', include: [{ model: AccessCategory, as: 'category', attributes: ['id', 'name'] }] }
      ]
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Obtenir toutes les commandes de l'utilisateur connecté
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { buyer_id: req.user.id },
      include: [
        { model: Event, as: 'event', attributes: ['id', 'title', 'date', 'image_url'] },
        { model: OrderItem, as: 'items', include: [{ model: AccessCategory, as: 'category', attributes: ['id', 'name'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mettre à jour une commande (nom, téléphone)
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, buyer_id: req.user.id }
    });
    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Impossible de modifier une commande déjà traitée' });
    }

    const { buyer_name, buyer_phone } = req.body;
    if (buyer_name) order.buyer_name = buyer_name;
    if (buyer_phone) order.buyer_phone = buyer_phone;
    await order.save();

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Confirmer un paiement (appelé par le webhook)
exports.confirmPayment = async (orderId, transactionId) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items', include: ['category'] }],
      transaction
    });
    if (!order || order.status !== 'pending') {
      throw new Error('Order not found or already processed');
    }

    order.status = 'paid';
    order.payment_intent_id = transactionId;
    await order.save({ transaction });

    for (const item of order.items) {
      const category = await AccessCategory.findByPk(item.access_category_id, { transaction });
      category.quantity_sold += item.quantity;
      await category.save({ transaction });

      // Créer les billets individuels
      for (let i = 0; i < item.quantity; i++) {
        await Ticket.create({
          order_id: order.id,
          event_id: order.event_id,
          user_id: order.buyer_id,
          category_id: item.access_category_id,
          category_name: item.category.name,
          price: item.unit_price,
          quantity: 1,
          buyer_name: order.buyer_name,
          buyer_phone: order.buyer_phone
        }, { transaction });
      }
    }

    // Générer le QR code pour la commande (optionnel, mais on le fait ici)
    await ticketService.generateAndSaveTicket(orderId).catch(err => console.error('Erreur génération QR:', err));

    await transaction.commit();
    return order;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.getOrderTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { order_id: req.params.id },
      include: [{ model: Event, attributes: ['title', 'date', 'location', 'image_url'] }]
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Télécharger le billet (QR code)
exports.downloadTicket = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, buyer_id: req.user.id }
    });
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    if (order.status !== 'paid') {
      return res.status(400).json({ error: 'Le billet n\'est disponible qu\'après paiement' });
    }

    // Si le QR n'existe pas encore, le générer
    if (!order.ticket_qr) {
      order.ticket_qr = await ticketService.generateAndSaveTicket(order.id);
    }

    // Renvoyer l'URL du QR (dataURL ou URL externe)
    res.json({ ticket: order.ticket_qr });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};