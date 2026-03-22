const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { Comment, User, Event } = require('../models');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.featured === 'true') where.featured = true;
    if (req.query.target_type) where.target_type = req.query.target_type;
    if (req.query.target_id) where.target_id = parseInt(req.query.target_id);

    const { count, rows } = await Comment.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }]
    });

    const enriched = await Promise.all(rows.map(async (comment) => {
      let target = null;
      if (comment.target_type === 'Event') {
        target = await Event.findByPk(comment.target_id, { attributes: ['id', 'title'] });
      } else if (comment.target_type === 'BlogPost') {
        // Temporairement, on ne charge pas les articles de blog
        target = { id: comment.target_id, title: 'Article (blog)' };
      }
      return { ...comment.toJSON(), target };
    }));

    res.json({ comments: enriched, totalPages: Math.ceil(count / limit), currentPage: page });
  } catch (err) {
    console.error('❌ Erreur GET /comments :', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { content, target_type, target_id } = req.body;
    if (!content || !target_type || !target_id) {
      return res.status(400).json({ error: 'Contenu, type et ID cible requis' });
    }
    if (target_type === 'Event') {
      const event = await Event.findByPk(target_id);
      if (!event) return res.status(404).json({ error: 'Événement introuvable' });
    } else if (target_type === 'BlogPost') {
      // Pour l’instant, on ignore la vérification
      // const post = await BlogPost.findByPk(target_id);
      // if (!post) return res.status(404).json({ error: 'Article introuvable' });
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

    const author = await User.findByPk(req.user.id, { attributes: ['id', 'name'] });
    let target = null;
    if (target_type === 'Event') {
      target = await Event.findByPk(target_id, { attributes: ['id', 'title'] });
    } else {
      target = { id: target_id, title: 'Article' };
    }

    res.status(201).json({ ...comment.toJSON(), author, target });
  } catch (err) {
    console.error('❌ Erreur POST /comments :', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

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
    console.error('❌ Erreur PATCH /comments/:id :', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;