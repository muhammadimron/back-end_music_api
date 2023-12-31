/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('playlists', {
    id: {
      type: 'VARCHAR(60)',
      primaryKey: true,
    },
    name: {
      type: 'VARCHAR(300)',
      notNull: true,
    },
    owner: {
      type: 'VARCHAR(60)',
      notNull: true,
    },
  });

  pgm.addConstraint('playlists', 'fk_playlists.owner_users.id', 'FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
  pgm.dropTable('playlists');
};
