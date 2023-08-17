/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable no-console */
require('dotenv').config();

// Dependencies
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');

// config
const config = require('./utils/config');

// albums
const albums = require('./api/albums');
const AlbumsValidator = require('./validator/albums');
const AlbumsService = require('./service/postgres/AlbumsService');

// songs
const songs = require('./api/songs');
const SongsValidator = require('./validator/songs');
const SongsService = require('./service/postgres/SongsService');

// users
const users = require('./api/users');
const UsersValidator = require('./validator/users');
const UsersService = require('./service/postgres/UsersService');

// authentications
const authentications = require('./api/authentications');
const TokenManager = require('./tokenize/tokenManager');
const AuthenticationsValidator = require('./validator/authentications');
const AuthenticationsService = require('./service/postgres/AuthenticationsService');

// playlists
const playlists = require('./api/playlists');
const PlaylistsValidator = require('./validator/playlists');
const PlaylistsService = require('./service/postgres/PlaylistsService');

// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsValidator = require('./validator/collaborations');
const CollaborationsService = require('./service/postgres/CollaborationsService');

// truncate
const truncate = require('./api/truncate');
const truncateValidator = require('./validator/truncate');
const TruncateService = require('./service/postgres/TruncateDBService');

// exports
const _exports = require('./api/exports');
const ProducerService = require('./service/exports/ProducerService');
const ExportsValidator = require('./validator/exports');

// caching
const CacheControl = require('./service/cache/CacheControl');

// exceptions
const ClientError = require('./exceptions/ClientError');

const init = async () => {
  const cacheControl = new CacheControl();
  const albumsService = new AlbumsService({ coverUploadFolder: path.resolve(__dirname, 'storage/album'), cacheControl });
  const songsService = new SongsService(cacheControl);
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const collaborationsService = new CollaborationsService(cacheControl);
  const playlistsService = new PlaylistsService({ collaborationsService, songsService: new SongsService(), cacheControl });

  const server = Hapi.server({
    host: config.app.host,
    port: config.app.port,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // outer plugin
  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  // jwt strategy
  server.auth.strategy('jwt_openmusic', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  // inner plugin
  await server.register([
    {
      plugin: albums,
      options: {
        albumsService,
        validator: AlbumsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        service: playlistsService,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        usersService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: truncate,
      options: {
        service: TruncateService,
        validator: truncateValidator,
      },
    },
    {
      plugin: _exports,
      options: {
        exportsService: ProducerService,
        playlistsService,
        validator: ExportsValidator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });

        newResponse.code(response.statusCode);
        return newResponse;
      }

      if (!response.isServer) {
        return h.continue;
      }

      const newResponse = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server',
      });

      newResponse.code(500);
      return newResponse;
    }

    return h.continue || response;
  });

  server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
