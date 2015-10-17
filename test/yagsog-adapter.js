var Yagsog = require('../yagsog.js');

module.exports = {
  pending: function () {
    return new Yagsog();
  },
  resolved: function (value) {
    var yagsog = new Yagsog();
    yagsog.fulfill(value);
    return yagsog;
  },
  rejected: function (reason) {
    var yagsog = new Yagsog();
    yagsog.reject(reason);
    return yagsog;
  },
  deferred: function () {
    var yagsog = new Yagsog();
    return yagsog;
  }
};
