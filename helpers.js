'use strict';

module.exports.jsonResponse = function (err, data) {
  return {
    meta: {
      status: err ? (err.status || 500) : 200,
      message: err ? (err.message || 'Error') : 'OK'
    },
    response: data || {}
  };
};
