const express = require('express');
const router = express.Router();
const { Comment, User, Event } = require('../models');
const authenticate = require('../middleware/auth');

// Route publique : récupérer les commentaires visibles (non masqués)
router.get('/public', async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { hidden: false },
      include: [
        { model: User, as: 'user', attributes: ['id', 'email'] },
        { model: Event, as: 'event', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route protégée : ajouter un commentaire (utilisateur connecté)
router.post('/', authenticate, async (req, res) => {
  const { event_id, content, rating } = req.body;
  try {
    // Optionnel : vérifier que l'utilisateur a acheté un billet pour cet événement
    const comment = await Comment.create({
      user_id: req.user.id,
      event_id,
      content,
      rating,
      hidden: false
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;