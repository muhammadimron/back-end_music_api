/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
const InvariantError = require('../../exceptions/InvariantError');

class TruncateHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.truncateAllTable = this.truncateAllTable.bind(this);
  }

  async truncateAllTable(request, h) {
    this._validator.validatePayload(request.payload);
    const { token } = request.payload;
    const myToken = process.env.MYTRUNCATE_TOKEN;
    if (token !== myToken) {
      throw new InvariantError('Token Invalid');
    }
    await this._service.truncateDB();

    return {
      status: 'success',
      message: 'berhasil mentruncate semua data table',
    };
  }
}

module.exports = TruncateHandler;
