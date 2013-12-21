var _ = require("underscore");
var when = require("when");

AbstractCoRHandler = {
  setNextHandler: function (handler) {
    this.nextHandler = handler;
    return this;
  },

  next: function () {
    return this.nextHandler;
  },

  handleNext: function (data) {
    return this.next().handle(data);
  },

  canHandleNext: function () {
    return this.nextHandler instanceof Object && this.nextHandler.handle instanceof Function;
  }
};

ActiveSessionValidationHandler = function (loginValidator) { this.loginValidator = loginValidator; };
_.extend(ActiveSessionValidationHandler.prototype, AbstractCoRHandler, {
  handle: function (response) {
    if (this.loginValidator.validateLogin(response))
      return when.resolve(response);

    return this.handleNext(response);
  }
});

//var LoggedOutHandler = function () {};


exports.AbstractCoRHandler = AbstractCoRHandler;
exports.ActiveSessionValidationHandler = ActiveSessionValidationHandler;
//exports.LoggedOutHandler = LoggedOutHandler;