const { Order, Event, User, OrderItem } = require('../models');

class TicketService {
  /**
   * Génère une URL d'image QR via une API publique (gratuite)
   * @param {number} orderId 
   * @returns {Promise<string>} URL de l'image QR
   */
  async generateTicketQR(orderId) {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: Event, as: 'event' },
        { model: User, as: 'buyer', attributes: ['id', 'email', 'name'] },
        { model: OrderItem, as: 'items', include: ['category'] }
      ]
    });
    if (!order) throw new Error('Commande introuvable');

    // Construction des données du billet (au format JSON)
    const ticketData = {
      orderId: order.id,
      eventId: order.event.id,
      eventTitle: order.event.title,
      eventDate: order.event.date,
      eventLocation: order.event.location,
      buyerName: order.buyer_name || order.buyer?.name || 'Participant',
      buyerEmail: order.buyer?.email,
      items: order.items.map(item => ({
        category: item.category.name,
        quantity: item.quantity,
        unitPrice: item.unit_price
      })),
      total: order.total_amount,
      status: order.status,
      generatedAt: new Date().toISOString()
    };

    // Encoder les données pour une URL
    const encodedData = encodeURIComponent(JSON.stringify(ticketData));
    
    // Utiliser l'API QR Server (gratuite)
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`;
    
    return qrImageUrl;
  }

  /**
   * Génère et enregistre l'URL du QR pour une commande (après paiement)
   * @param {number} orderId
   * @returns {Promise<string>} URL du QR
   */
  async generateAndSaveTicket(orderId) {
    const qrUrl = await this.generateTicketQR(orderId);
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error('Commande introuvable');
    order.ticket_qr = qrUrl; // Stocker l'URL, pas une dataURL
    await order.save();
    return qrUrl;
  }
}

module.exports = new TicketService();