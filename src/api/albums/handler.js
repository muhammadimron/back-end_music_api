/* eslint-disable no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
class AlbumsHandler {
  constructor({ albumsService, validator }) {
    this._albumsService = albumsService;
    this._validator = validator;
  }

  async postAlbum(request, h) {
    await this._validator.validateAlbumPayload(request.payload);

    const { name, year } = request.payload;
    const albumId = await this._albumsService.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: { albumId },
    });

    response.code(201);
    return response;
  }

  async getAlbumById(request, h) {
    const { id } = request.params;

    const album = await this._albumsService.getAlbumById(id);
    const songs = await this._albumsService.getAlbumByIdWithSongs(id);

    return {
      status: 'success',
      data: {
        album: {
          ...album,
          songs,
        },
      },
    };
  }

  async putAlbumById(request, h) {
    await this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    await this._albumsService.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album telah diperbarui',
    };
  }

  async deleteAlbumById(request, h) {
    const { id } = request.params;
    await this._albumsService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album telah dihapus',
    };
  }

  async postAlbumCoverHandler({ payload, params }, h) {
    const { cover } = payload;
    const { id } = params;

    this._validator.validateUploadCoverHeadersSchema(cover.hapi.headers);
    const filename = await this._albumsService.uploadCover(cover);
    await this._albumsService.editAlbumCoverById(id, filename);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });

    response.code(201);
    return response;
  }

  async postAlbumLikeHandler(request, h) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    const isAlbumsLike = await this._albumsService.verifyExistAlbumLikeStatusById(id, userId);
    if (isAlbumsLike > 0) {
      await this._albumsService.deleteAlbumLikeStatusById(id, userId);
      const response = h.response({
        status: 'success',
        message: 'Berhasil melakukan dislike pada album!',
      });
      response.code(201);
      return response;
    }

    await this._albumsService.addAlbumLikeStatus(id, userId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menyukai album!',
    });
    response.code(201);
    return response;
  }

  async getAlbumLikesHandler(request, h) {
    const { id } = request.params;
    const { count, isCache } = await this._albumsService.getAlbumLikesCountByAlbumId(id);

    const response = {
      status: 'success',
      data: { likes: count },
    };

    if (isCache) {
      return h.response(response).header('X-Data-Source', 'cache');
    }

    return response;
  }
}

module.exports = AlbumsHandler;
