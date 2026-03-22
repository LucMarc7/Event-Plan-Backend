'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Comments', 'target_type', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Event'
    });
    await queryInterface.addColumn('Comments', 'target_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Comments', 'target_type');
    await queryInterface.removeColumn('Comments', 'target_id');
  }
};