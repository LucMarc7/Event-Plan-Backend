const { User } = require('../models');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Récupérer le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour les informations du profil
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const { name, phone, city, country, birth_date } = req.body;
    // Mise à jour des champs
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (city !== undefined) user.city = city;
    if (country !== undefined) user.country = country;
    if (birth_date !== undefined) user.birth_date = birth_date;

    // Gestion de l'avatar (si un fichier a été uploadé)
    if (req.file) {
      // Supprimer l'ancien avatar si existe
      if (user.avatar_url) {
        const oldPath = path.join(__dirname, '../../', user.avatar_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      user.avatar_url = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    const userData = user.toJSON();
    delete userData.password;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Changer le mot de passe
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Mettre à jour le mot de passe (le hook beforeUpdate le hashera)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};