const routes = (handler) => [
  {
    path: '/songs',
    method: 'POST',
    handler: (request, h) => handler.postSong(request, h),
  },
  {
    path: '/songs',
    method: 'GET',
    handler: (request, h) => handler.getSongs(request, h),
  },
  {
    path: '/songs/{id}',
    method: 'GET',
    handler: (request, h) => handler.getSongById(request, h),
  },
  {
    path: '/songs/{id}',
    method: 'PUT',
    handler: (request, h) => handler.putSongById(request, h),
  },
  {
    path: '/songs/{id}',
    method: 'DELETE',
    handler: (request, h) => handler.deleteSongById(request, h),
  },
];

module.exports = routes;
