const paymentService = require('../services/paymentService');
const orderController = require('./orderController');
const { Order } = require('../models');
const { sequelize } = require('../models');
const ticketService = require('../services/ticketService');

// Initier un paiement
exports.initiatePayment = async (req, res) => {
  const { orderId, clientPhone, telecom } = req.body;

  if (!orderId || !clientPhone || !telecom) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  if (!['OM', 'AM', 'MP', 'AF'].includes(telecom)) {
    return res.status(400).json({ error: 'Opérateur invalide' });
  }
  if (!/^243[0-9]{9}$/.test(clientPhone)) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide (format: 243XXXXXXXX)' });
  }

  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }
    if (order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Cette commande ne vous appartient pas' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Commande déjà traitée' });
    }

    const amount = parseFloat(order.total_amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(500).json({ error: 'Montant de commande invalide' });
    }

    let paymentResult;
    try {
      paymentResult = await paymentService.initiatePayment({
        clientPhone,
        amount,
        currency: 'CDF',
        telecom
      });
    } catch (serviceError) {
      console.error('Erreur du service de paiement:', serviceError);
      return res.status(502).json({ error: 'Service de paiement indisponible' });
    }

    if (!paymentResult || typeof paymentResult.status === 'undefined') {
      console.error('Réponse de paiement invalide:', paymentResult);
      return res.status(502).json({ error: 'Réponse invalide du service de paiement' });
    }

    const { status, data } = paymentResult;

    if (status === 102 || status === 200) {
      const transactionId = data?.transactionId || data?.sessionId;
      if (transactionId) {
        order.payment_intent_id = transactionId;
        await order.save();
      }

      if (status === 200) {
        return res.status(200).json({
          success: true,
          message: 'Paiement réussi',
          transactionId
        });
      } else {
        return res.status(202).json({
          message: 'Transaction en cours, veuillez confirmer sur votre téléphone',
          transactionId
        });
      }
    }

    const errorMessage = data?.message || 'Erreur de paiement';
    switch (status) {
      case 400:
        return res.status(400).json({ error: `Requête invalide: ${errorMessage}` });
      case 401:
        return res.status(401).json({ error: 'Authentification échouée (clés API invalides)' });
      case 402:
        return res.status(402).json({ error: `Paiement échoué: ${errorMessage}` });
      case 403:
        return res.status(403).json({ error: 'Accès interdit (vérifiez vos droits)' });
      case 409:
        return res.status(409).json({ error: 'Conflit de transaction (double tentative?)' });
      case 429:
        return res.status(429).json({ error: 'Trop de requêtes, veuillez réessayer plus tard' });
      default:
        return res.status(status || 500).json({ error: errorMessage });
    }
  } catch (error) {
    console.error('Erreur inattendue dans initiatePayment:', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
};

// Webhook de notification
exports.paymentWebhook = async (req, res) => {
  const callbackData = req.body;
  console.log('Webhook reçu:', JSON.stringify(callbackData, null, 2));

  try {
    if (!callbackData.payment || callbackData.payment.status !== 'success') {
      return res.sendStatus(200);
    }

    const transactionId = callbackData.payment.transactionId;
    if (!transactionId) {
      console.error('Webhook: transactionId manquant');
      return res.sendStatus(200);
    }

    const order = await Order.findOne({ where: { payment_intent_id: transactionId } });
    if (!order) {
      console.error(`Webhook: aucune commande trouvée avec transactionId ${transactionId}`);
      return res.sendStatus(200);
    }

    if (order.status !== 'pending') {
      console.log(`Webhook: commande ${order.id} déjà traitée (statut ${order.status})`);
      return res.sendStatus(200);
    }

    const transaction = await sequelize.transaction();
    try {
      await orderController.confirmPayment(order.id, transactionId);
      await transaction.commit();
      console.log(`Commande ${order.id} confirmée avec succès via webhook`);
    } catch (confirmError) {
      await transaction.rollback();
      console.error(`Erreur lors de la confirmation de la commande ${order.id}:`, confirmError);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Erreur dans paymentWebhook:', error);
    res.sendStatus(500);
  }
};