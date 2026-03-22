'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ajouter les colonnes polymorphiques
    await queryInterface.addColumn('Comments', 'target_type', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Event'
    });
    await queryInterface.addColumn('Comments', 'target_id', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    // Optionnel : supprimer les anciennes colonnes si elles existent
    // await queryInterface.removeColumn('Comments', 'post_id');
    // await queryInterface.removeColumn('Comments', 'event_id');
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Comments', 'target_type');
    await queryInterface.removeColumn('Comments', 'target_id');
    // Restaurer les anciennes colonnes si nécessaire
    // await queryInterface.addColumn('Comments', 'post_id', { type: Sequelize.INTEGER });
  }
};