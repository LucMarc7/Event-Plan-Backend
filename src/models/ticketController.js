const { Ticket, Event } = require('../models');
const QRCode = require('qrcode');

// Récupérer les tickets de l'utilisateur connecté
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Event, attributes: ['title', 'date', 'location'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Générer le QR code d'un ticket
exports.getTicketQRCode = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [{ model: Event, attributes: ['title', 'date', 'location'] }]
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    // Vérifier que le ticket appartient à l'utilisateur ou que l'utilisateur est admin
    if (ticket.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    const data = {
      ticket_code: ticket.ticket_code,
      event: ticket.Event.title,
      date: ticket.Event.date,
      category: ticket.category_name,
      buyer: ticket.buyer_name
    };
    const qrData = JSON.stringify(data);
    const qrImage = await QRCode.toDataURL(qrData);
    res.json({ qr: qrImage, ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Valider un ticket (pour le contrôle d'accès)
exports.validateTicket = async (req, res) => {
  const { ticket_code } = req.body;
  try {
    const ticket = await Ticket.findOne({
      where: { ticket_code },
      include: [{ model: Event, attributes: ['title'] }]
    });
    if (!ticket) return res.status(404).json({ valid: false, message: 'Billet introuvable' });
    if (ticket.used) return res.status(400).json({ valid: false, message: 'Billet déjà utilisé' });
    // Marquer comme utilisé
    ticket.used = true;
    ticket.used_at = new Date();
    await ticket.save();
    res.json({ valid: true, message: 'Billet valide', event: ticket.Event.title });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};