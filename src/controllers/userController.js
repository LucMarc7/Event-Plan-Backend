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
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour le profil (sans mot de passe)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, city, country, birth_date } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    let avatar = user.avatar;
    if (req.file) {
      if (user.avatar) {
        const oldPath = path.join(__dirname, '../../', user.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      city: city || user.city,
      country: country || user.country,
      birth_date: birth_date || user.birth_date,
      avatar
    });

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
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }

    user.password = newPassword; // le hook beforeUpdate fera le hash
    await user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mise à jour de l'avatar uniquement (upload séparé)
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      console.error('❌ Aucun fichier reçu dans req.file');
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    console.log('📁 Fichier reçu :', req.file); // Log pour voir ce qui est reçu

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    // Supprimer l'ancien avatar s'il existe
    if (user.avatar) {
      const oldPath = path.join(__dirname, '../../', user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        console.log('🗑️ Ancien avatar supprimé :', oldPath);
      }
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    console.log('🖼️ Nouvelle URL avatar :', avatarUrl);

    await user.update({ avatar: avatarUrl });

    const userData = user.toJSON();
    delete userData.password;
    res.json(userData);
  } catch (error) {
    console.error('❌ Erreur dans updateAvatar :', error);
    res.status(500).json({ error: error.message });
  }
};