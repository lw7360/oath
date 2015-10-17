'use strict';

var states = {
  PENDING: -1,
  REJECTED: 0,
  FULFILLED: 1
};

function doNext (func) {
  setTimeout(func, 0);
}

function isObject (object) {
  return object && typeof object === (typeof {});
}

function isFunction (object) {
  return object && typeof object === (typeof isFunction);
}

function doResolution (promise, x) {
  if (isObject(x) || isFunction(x)) {
    if (x === promise.promise) {
      promise.reject(new TypeError('Cannot fulfill a promise with itself as the value'));
    }

    var then;
    try {
      then = x.then;
    } catch (e) {
      return promise.reject(e);
    }

    if (isFunction(then)) {
      var called = false;

      try {
        then.call(
            x,
            function (y) {
              if (called) return;
              doResolution(promise, y);
              called = true;
            },
            function (r) {
              if (called) return;
              promise.reject(r);
              called = true;
            }
            );
      } catch (e) {
        if (!called) {
          promise.reject(e);
        }
      }
    } else {
      promise.fulfill(x);
    }
  } else {
    promise.fulfill(x);
  }
}

/**
 * @class
 */

function Yagsog () {
  this._state = states.PENDING;
  this._value = undefined;
  this._reason = undefined;
  this._callbacks = [];

  this._executeOnFulfilledCallback = this._executeOnFulfilledCallback.bind(this);
  this._executeOnRejectedCallback = this._executeOnRejectedCallback.bind(this);

  this.then = this.then.bind(this);

  this.fulfill = this.resolve = this.fulfill.bind(this);
  this.reject = this.reject.bind(this);

  this.promise = this.thenable = {
    then: this.then
  };
}

Yagsog.prototype._storeCallbacks = function (onFulfilled, onRejected, promise) {
  this._callbacks.push({
    onFulfilled: onFulfilled,
    onRejected: onRejected,
    promise: promise
  });
};

function executeCallback (callback, promise, argument) {
  var result;
  try {
    result = callback(argument);
  } catch (e) {
    return promise.reject(e);
  }

  doResolution(promise, result);
}

Yagsog.prototype._executeOnFulfilledCallback = function (callbackInfo) {
  if (isFunction(callbackInfo.onFulfilled)) {
    executeCallback(callbackInfo.onFulfilled, callbackInfo.promise, this._value);
  } else {
    callbackInfo.promise.fulfill(this._value);
  }
};

Yagsog.prototype._executeOnRejectedCallback = function (callbackInfo) {
  if (isFunction(callbackInfo.onRejected)) {
    executeCallback(callbackInfo.onRejected, callbackInfo.promise, this._reason);
  } else {
    callbackInfo.promise.reject(this._reason);
  }
};

Yagsog.prototype._executeCallbacks = function (isFulfilled) {
  var callbacks = this._callbacks;

  this._callbacks = null;

  if (isFulfilled) {
    callbacks.forEach(this._executeOnFulfilledCallback);
  } else {
    callbacks.forEach(this._executeOnRejectedCallback);
  }
};

Yagsog.prototype.fulfill = function (fulfilledValue) {
  if (this._state !== states.PENDING) return;

  this._state = states.FULFILLED;

  this._value = fulfilledValue;

  doNext(this._executeCallbacks.bind(this, true));

  return this;
};

Yagsog.prototype.reject = function (reasonRejected) {
  if (this._state !== states.PENDING) return;

  this._state = states.REJECTED;

  this._reason = reasonRejected;

  doNext(this._executeCallbacks.bind(this, false));

  return this;
};

Yagsog.prototype.then = function (onFulfilled, onRejected) {
  var promise = new Yagsog();

  var value = this._value;
  var reason = this._reason;

  switch (this._state) {
    case states.PENDING:
      this._storeCallbacks(onFulfilled, onRejected, promise);
      break;

    case states.FULFILLED:
      if (isFunction(onFulfilled)) {
        doNext(function () {
          executeCallback(onFulfilled, promise, value);
        });
      } else {
        promise.fulfill(this._value);
      }
      break;

    case states.REJECTED:
      if (isFunction(onRejected)) {
        doNext(function () {
          executeCallback(onRejected, promise, reason);
        });
      } else {
        promise.reject(this._reason);
      }
      break;
  }

  return promise.thenable;
};

module.exports = Yagsog;
