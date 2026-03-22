const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { Comment, User, Event, BlogPost } = require('../models');

// GET /comments – liste paginée, avec option featured
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.featured === 'true') where.featured = true;

    const { count, rows } = await Comment.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }]
    });

    // Enrichir chaque commentaire avec les infos de la cible
    const enriched = await Promise.all(rows.map(async (comment) => {
      let target = null;
      if (comment.target_type === 'Event') {
        target = await Event.findByPk(comment.target_id, { attributes: ['id', 'title'] });
      } else if (comment.target_type === 'BlogPost') {
        target = await BlogPost.findByPk(comment.target_id, { attributes: ['id', 'title', 'slug'] });
      }
      return {
        ...comment.toJSON(),
        target
      };
    }));

    res.json({
      comments: enriched,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /comments – créer un commentaire (authentifié)
router.post('/', authenticate, async (req, res) => {
  try {
    const { content, target_type, target_id } = req.body;
    if (!content || !target_type || !target_id) {
      return res.status(400).json({ error: 'Contenu, type et ID cible requis' });
    }

    // Vérifier l’existence de la cible
    if (target_type === 'Event') {
      const event = await Event.findByPk(target_id);
      if (!event) return res.status(404).json({ error: 'Événement introuvable' });
    } else if (target_type === 'BlogPost') {
      const post = await BlogPost.findByPk(target_id);
      if (!post) return res.status(404).json({ error: 'Article introuvable' });
    } else {
      return res.status(400).json({ error: 'Type de cible non supporté' });
    }

    const comment = await Comment.create({
      content,
      target_type,
      target_id,
      author_id: req.user.id,
      featured: false
    });

    const fullComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }]
    });

    // Ajouter l’info cible (minimale) à la réponse
    let targetInfo = null;
    if (target_type === 'Event') {
      targetInfo = await Event.findByPk(target_id, { attributes: ['id', 'title'] });
    } else if (target_type === 'BlogPost') {
      targetInfo = await BlogPost.findByPk(target_id, { attributes: ['id', 'title', 'slug'] });
    }
    const responseData = fullComment.toJSON();
    responseData.target = targetInfo;

    res.status(201).json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /comments/:id – mettre à jour featured (admin/superadmin)
router.patch('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Commentaire introuvable' });
    comment.featured = req.body.featured !== undefined ? req.body.featured : !comment.featured;
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;