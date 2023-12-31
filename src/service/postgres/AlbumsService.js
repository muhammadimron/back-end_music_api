/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable no-underscore-dangle */
const fs = require('fs');
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapAlbumToModel } = require('../../utils/mapDBToModel');

class AlbumsService {
  constructor({ coverUploadFolder, cacheControl }) {
    this._pool = new Pool();
    this._coverUploadFolder = coverUploadFolder;
    this._cacheControl = cacheControl;

    if (!fs.existsSync(coverUploadFolder)) {
      fs.mkdirSync(coverUploadFolder, { recursive: true });
    }
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const query = {
      text: 'INSERT INTO albums VALUES ($1, $2, $3) RETURNING id',
      values: [`album-${id}`, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Gagal menambahkan album');
    }

    await this._cacheControl.del('albums');
    return result.rows[0].id;
  }

  async getAlbums() {
    try {
      const albums = await this._cacheControl.get('albums');
      return JSON.parse(albums);
    } catch {
      const result = await this._pool.query('SELECT * FROM albums');
      await this._cacheControl.set('albums', JSON.stringify(result.rows));
      return result.rows;
    }
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('ID album tidak ditemukan');
    }

    return result.rows.map(mapAlbumToModel)[0];
  }

  async getAlbumByIdWithSongs(id) {
    const query = {
      text: `
        SELECT songs.id, songs.title, songs.performer FROM albums
        LEFT JOIN songs ON songs.album_id = albums.id
        WHERE albums.id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('ID album tidak ditemukan');
    }

    return result.rows;
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('ID album tidak ditemukan');
    }

    await this._cacheControl.del('albums');
  }

  async editAlbumCoverById(id, filename) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2',
      values: [filename, id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Cannot find album ID!');
    }
  }

  async _verifyExistAlbumById(id) {
    const query = {
      text: 'SELECT id FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Album ID not found!');
    }
  }

  async verifyExistAlbumLikeStatusById(albumId, userId) {
    await this._verifyExistAlbumById(albumId);
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);
    return result.rowCount;
  }

  async deleteAlbumLikeStatusById(albumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Cannot find album & user ID!');
    }

    await this._cacheControl.del(`album:like:${albumId}`);
  }

  async addAlbumLikeStatus(albumId, userId) {
    const id = `like-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO user_album_likes VALUES ($1, $2, $3)',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Cannot like album ID!');
    }

    await this._cacheControl.del(`album:like:${albumId}`);
  }

  async deleteAlbumById(id) {
    const { cover } = await this.getAlbumById(id);
    const query = {
      text: 'DELETE FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Cannot find album ID!');
    }

    if (cover) {
      fs.unlink(`${this._coverUploadFolder}/${cover}`);
    }

    await this._cacheControl.del('albums');
  }

  async getAlbumLikesCountByAlbumId(albumId) {
    try {
      const likeCounts = await this._cacheControl.get(`album:like:${albumId}`);
      return {
        count: JSON.parse(likeCounts),
        isCache: true,
      };
    } catch {
      const query = {
        text: 'SELECT user_id FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new NotFoundError('Cannot find album ID!');
      }
      await this._cacheControl.set(`album:like:${albumId}`, JSON.stringify(result.rowCount));

      return {
        count: result.rowCount,
        isCache: false,
      };
    }
  }

  async uploadCover(file) {
    const filename = `cover-${nanoid(12)}${file.hapi.filename}`;
    const directory = `${this._coverUploadFolder}/${filename}`;
    const fileStream = fs.createWriteStream(directory);

    return new Promise((resolve, reject) => {
      fileStream.on('error', (error) => reject(error));
      file.pipe(fileStream);
      file.on('end', () => resolve(filename));
    });
  }
}

module.exports = AlbumsService;
