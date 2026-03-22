const express = require('express');
const router = express.Router();
const { BlogPost, User } = require('../models');

// GET /blog/posts – liste paginée
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await BlogPost.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }]
    });

    res.json({
      posts: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /blog/posts/:slug – article détaillé
router.get('/posts/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({
      where: { slug: req.params.slug },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }]
    });
    if (!post) return res.status(404).json({ error: 'Article non trouvé' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;