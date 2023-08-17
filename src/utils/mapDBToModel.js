/* eslint-disable camelcase */
const config = require('./config');

const mapGetSong = ({
  id, title, year, performer, genre, duration, album_id,
}) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId: album_id,
});

const mapAlbumToModel = ({
  id,
  name,
  year,
  cover,
}) => ({
  id,
  name,
  year,
  coverUrl: cover ? `http://${config.app.host}:${config.app.port}/albums/cover/${cover}` : null,
});

module.exports = { mapGetSong, mapAlbumToModel };
