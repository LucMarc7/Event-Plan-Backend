const { Event, AccessCategory, User, Order } = require('../models');
const { validationResult } = require('express-validator');
const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');

// ============================================
// CRÉER UN ÉVÉNEMENT (avec upload d'image)
// ============================================
exports.createEvent = async (req, res) => {
  console.log('--- createEvent ---');
  console.log('req.user:', req.user?.id, req.user?.role);
  console.log('req.body:', req.body);
  console.log('req.file:', req.file);

  const { title, description, date, location, total_access, categories } = req.body;
  const imageFile = req.file;

  if (!title || !date || !total_access || !categories) {
    console.log('Champs requis manquants');
    if (imageFile) fs.unlinkSync(imageFile.path);
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  if (req.user.role !== 'seller') {
    console.log('Utilisateur non vendeur, rôle:', req.user.role);
    if (imageFile) fs.unlinkSync(imageFile.path);
    return res.status(403).json({ error: 'Accès refusé. Réservé aux vendeurs.' });
  }

  let parsedCategories;
  try {
    parsedCategories = JSON.parse(categories);
    console.log('Catégories parsées:', parsedCategories);
  } catch (e) {
    console.log('Erreur parsing JSON des catégories:', e.message);
    if (imageFile) fs.unlinkSync(imageFile.path);
    return res.status(400).json({ error: 'Format des catégories invalide' });
  }

  if (!Array.isArray(parsedCategories) || parsedCategories.length === 0) {
    console.log('Catégories vides ou non tableau');
    if (imageFile) fs.unlinkSync(imageFile.path);
    return res.status(400).json({ error: 'Au moins une catégorie est requise' });
  }

  const transaction = await sequelize.transaction();

  try {
    const sumCategories = parsedCategories.reduce((sum, cat) => sum + parseInt(cat.quantity_total || 0), 0);
    console.log('Somme catégories:', sumCategories, 'total_access:', total_access);
    if (sumCategories !== parseInt(total_access)) {
      console.log('Incohérence somme catégories / total_access');
      await transaction.rollback();
      if (imageFile) fs.unlinkSync(imageFile.path);
      return res.status(400).json({ error: 'Le nombre total d\'accès doit être égal à la somme des quantités des catégories' });
    }

    let image_url = null;
    if (imageFile) {
      image_url = `/uploads/events/${imageFile.filename}`;
      console.log('Image URL:', image_url);
    }

    console.log('Création de l\'événement...');
    const event = await Event.create({
      seller_id: req.user.id,
      title,
      description,
      date,
      location,
      total_access: parseInt(total_access),
      status: 'draft',
      image_url
    }, { transaction });
    console.log('Événement créé avec id:', event.id);

    const categoriesToCreate = parsedCategories.map(cat => ({
      name: cat.name,
      price: parseFloat(cat.price),
      commission_rate: parseInt(cat.commission_rate),
      quantity_total: parseInt(cat.quantity_total),
      event_id: event.id,
      quantity_sold: 0
    }));
    console.log('Catégories à créer:', categoriesToCreate);

    await AccessCategory.bulkCreate(categoriesToCreate, { transaction });
    console.log('Catégories insérées');

    await transaction.commit();
    console.log('Transaction commitée');

    const createdEvent = await Event.findByPk(event.id, {
      include: [{ model: AccessCategory, as: 'categories' }]
    });

    res.status(201).json(createdEvent);
  } catch (error) {
    console.log('ERREUR dans createEvent:');
    console.error(error); // Affiche la stack complète
    await transaction.rollback();
    if (imageFile) {
      try { fs.unlinkSync(imageFile.path); } catch (e) {}
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================
// OBTENIR TOUS LES ÉVÉNEMENTS PUBLIÉS
// ============================================
exports.getEvents = async (req, res) => {
  console.log('--- getEvents ---');
  try {
    const events = await Event.findAll({
      where: { status: 'published' },
      include: [
        { model: AccessCategory, as: 'categories' },
        { model: User, as: 'seller', attributes: ['id', 'email', 'category'] }
      ],
      order: [['date', 'ASC']]
    });
    res.json(events);
  } catch (error) {
    console.error('Erreur getEvents:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================
// OBTENIR UN ÉVÉNEMENT PAR ID
// ============================================
exports.getEventById = async (req, res) => {
  console.log('--- getEventById --- id:', req.params.id);
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: AccessCategory, as: 'categories' },
        { model: User, as: 'seller', attributes: ['id', 'email', 'category'] }
      ]
    });
    if (!event) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    res.json(event);
  } catch (error) {
    console.error('Erreur getEventById:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================
// OBTENIR LES ÉVÉNEMENTS DU VENDEUR CONNECTÉ
// ============================================
exports.getMyEvents = async (req, res) => {
  console.log('--- getMyEvents --- user:', req.user.id, req.user.role);
  if (req.user.role !== 'seller') {
    console.log('Accès refusé: utilisateur non vendeur');
    return res.status(403).json({ error: 'Accès refusé' });
  }
  try {
    const events = await Event.findAll({
      where: { seller_id: req.user.id },
      include: [{ model: AccessCategory, as: 'categories' }],
      order: [['date', 'DESC']]
    });
    res.json(events);
  } catch (error) {
    console.error('Erreur getMyEvents:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================
// PUBLIER UN ÉVÉNEMENT (draft -> published)
// ============================================
exports.publishEvent = async (req, res) => {
  console.log('--- publishEvent --- id:', req.params.id);
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, seller_id: req.user.id }
    });
    if (!event) {
      console.log('Événement non trouvé');
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    if (event.status !== 'draft') {
      console.log('Statut incorrect:', event.status);
      return res.status(400).json({ error: 'Événement déjà publié ou annulé' });
    }
    event.status = 'published';
    await event.save();
    console.log('Événement publié');
    res.json(event);
  } catch (error) {
    console.error('Erreur publishEvent:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================
// MODIFIER UN ÉVÉNEMENT (avec possibilité de changer l'image)
// ============================================
exports.updateEvent = async (req, res) => {
  console.log('--- updateEvent --- id:', req.params.id);
  const imageFile = req.file;
  const { title, description, date, location, total_access, categories, keepImage } = req.body;
  const eventId = req.params.id;

  try {
    const event = await Event.findOne({
      where: { id: eventId, seller_id: req.user.id }
    });
    if (!event) {
      console.log('Événement non trouvé');
      if (imageFile) fs.unlinkSync(imageFile.path);
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    if (event.status !== 'draft') {
      console.log('Impossible de modifier un événement publié');
      if (imageFile) fs.unlinkSync(imageFile.path);
      return res.status(400).json({ error: 'Impossible de modifier un événement déjà publié' });
    }

    let parsedCategories = null;
    if (categories) {
      try {
        parsedCategories = JSON.parse(categories);
        console.log('Catégories parsées (update):', parsedCategories);
      } catch (e) {
        console.log('Erreur parsing JSON (update):', e.message);
        if (imageFile) fs.unlinkSync(imageFile.path);
        return res.status(400).json({ error: 'Format des catégories invalide' });
      }
    }

    if (parsedCategories) {
      const sumCategories = parsedCategories.reduce((sum, cat) => sum + parseInt(cat.quantity_total || 0), 0);
      console.log('Somme catégories (update):', sumCategories, 'total_access:', total_access);
      if (sumCategories !== parseInt(total_access)) {
        console.log('Incohérence somme catégories / total_access (update)');
        if (imageFile) fs.unlinkSync(imageFile.path);
        return res.status(400).json({ error: 'Le nombre total d\'accès doit être égal à la somme des quantités des catégories' });
      }
    }

    const transaction = await sequelize.transaction();

    try {
      let image_url = event.image_url;
      if (imageFile) {
        console.log('Nouvelle image uploadée:', imageFile.filename);
        if (event.image_url) {
          const oldPath = path.join(__dirname, '../../', event.image_url);
          if (fs.existsSync(oldPath)) {
            console.log('Suppression ancienne image:', oldPath);
            fs.unlinkSync(oldPath);
          }
        }
        image_url = `/uploads/events/${imageFile.filename}`;
      } else if (keepImage === 'false') {
        console.log('Suppression de l\'image demandée');
        if (event.image_url) {
          const oldPath = path.join(__dirname, '../../', event.image_url);
          if (fs.existsSync(oldPath)) {
            console.log('Suppression image:', oldPath);
            fs.unlinkSync(oldPath);
          }
        }
        image_url = null;
      }

      console.log('Mise à jour événement...');
      await event.update({
        title,
        description,
        date,
        location,
        total_access: parseInt(total_access),
        image_url
      }, { transaction });

      if (parsedCategories) {
        console.log('Suppression anciennes catégories');
        await AccessCategory.destroy({ where: { event_id: event.id }, transaction });
        const categoriesToCreate = parsedCategories.map(cat => ({
          name: cat.name,
          price: parseFloat(cat.price),
          commission_rate: parseInt(cat.commission_rate),
          quantity_total: parseInt(cat.quantity_total),
          event_id: event.id,
          quantity_sold: 0
        }));
        console.log('Création nouvelles catégories:', categoriesToCreate);
        await AccessCategory.bulkCreate(categoriesToCreate, { transaction });
      }

      await transaction.commit();
      console.log('Transaction commitée (update)');

      const updatedEvent = await Event.findByPk(event.id, {
        include: [{ model: AccessCategory, as: 'categories' }]
      });
      res.json(updatedEvent);
    } catch (error) {
      console.log('Erreur dans la transaction updateEvent:', error);
      await transaction.rollback();
      if (imageFile) fs.unlinkSync(imageFile.path);
      throw error;
    }
  } catch (error) {
    console.error('Erreur dans updateEvent:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================
// SUPPRIMER UN ÉVÉNEMENT (seulement si aucune vente)
// ============================================
exports.deleteEvent = async (req, res) => {
  console.log('--- deleteEvent --- id:', req.params.id);
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, seller_id: req.user.id },
      include: [{ model: AccessCategory, as: 'categories' }]
    });
    if (!event) {
      console.log('Événement non trouvé');
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    const hasSales = event.categories.some(cat => cat.quantity_sold > 0);
    if (hasSales) {
      console.log('Impossible de supprimer : ventes existantes');
      return res.status(400).json({ error: 'Impossible de supprimer un événement avec des ventes' });
    }

    if (event.image_url) {
      const imagePath = path.join(__dirname, '../../', event.image_url);
      if (fs.existsSync(imagePath)) {
        console.log('Suppression image:', imagePath);
        fs.unlinkSync(imagePath);
      }
    }

    await event.destroy();
    console.log('Événement supprimé');
    res.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteEvent:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================
// STATISTIQUES POUR LE TABLEAU DE BORD VENDEUR
// ============================================
exports.getSellerStats = async (req, res) => {
  console.log('--- getSellerStats --- user:', req.user.id);
  try {
    const events = await Event.findAll({
      where: { seller_id: req.user.id },
      include: [{ model: AccessCategory, as: 'categories' }]
    });

    let totalRevenue = 0;
    let totalCommission = 0;
    let totalTicketsSold = 0;

    events.forEach(event => {
      event.categories.forEach(cat => {
        const revenue = cat.quantity_sold * parseFloat(cat.price);
        totalRevenue += revenue;
        totalCommission += revenue * (cat.commission_rate / 100);
        totalTicketsSold += cat.quantity_sold;
      });
    });

    const stats = {
      totalEvents: events.length,
      totalTicketsSold,
      totalRevenue,
      totalCommission,
      netRevenue: totalRevenue - totalCommission
    };
    console.log('Stats calculées:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Erreur getSellerStats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};