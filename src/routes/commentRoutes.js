const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { BlogComment, BlogPost, User } = require('../models'); // importer les nouveaux modèles

// GET /comments – liste paginée, avec option featured
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.featured === 'true') where.featured = true;

    const { count, rows } = await BlogComment.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'author', attributes: ['id', 'name'] },
        { model: BlogPost, as: 'post', attributes: ['id', 'title', 'slug'] }
      ]
    });

    res.json({
      comments: rows,
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
    const { content, post_id } = req.body;
    if (!content || !post_id) {
      return res.status(400).json({ error: 'Contenu et post_id requis' });
    }
    const comment = await BlogComment.create({
      content,
      post_id,
      author_id: req.user.id,
      featured: false
    });
    // Récupérer l’auteur et le post pour la réponse
    const fullComment = await BlogComment.findByPk(comment.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name'] },
        { model: BlogPost, as: 'post', attributes: ['id', 'title', 'slug'] }
      ]
    });
    res.status(201).json(fullComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /comments/:id – (superadmin) toggle featured
router.patch('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }
  try {
    const comment = await BlogComment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Commentaire introuvable' });
    comment.featured = req.body.featured !== undefined ? req.body.featured : !comment.featured;
    await comment.save();
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;