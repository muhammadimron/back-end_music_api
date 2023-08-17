const routes = (handler) => [
  {
    method: 'POST',
    path: '/export/playlists/{id}',
    handler: (request, h) => handler.postExportSongsHandler(request, h),
    options: {
      auth: 'jwt_openmusic',
    },
  },
];

module.exports = routes;
