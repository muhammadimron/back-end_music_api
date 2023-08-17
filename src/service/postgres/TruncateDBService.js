const { Pool } = require('pg');

const TruncateService = {
  truncateDB: async () => {
    const pool = new Pool();
    await pool.query('TRUNCATE songs, albums, playlistsongs, authentications, users, playlists, collaborations, playlist_song_activities');
  },
};

module.exports = TruncateService;
