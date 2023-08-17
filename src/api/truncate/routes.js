const routes = (handler) => [
  {
    path: '/truncate',
    method: 'DELETE',
    handler: (request, h) => handler.truncateAllTable(request, h),
  },
];

module.exports = routes;
