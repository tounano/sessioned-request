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

var LoggedOutHandler = function (loginManager) { this.loginManager = loginManager; };
_.extend(LoggedOutHandler.prototype, AbstractCoRHandler, {

  handle: function () {
    return this.
      loginManager.login()
      .then(methodDispatcher(this, "handleNext"));
  }
});


function methodDispatcher(object, method) {
  return function () {
    object[method].apply(object, arguments);
  };
}

var RetryRequestHandler = function (promisifiedRequestCommand) { this.promisifiedRequestCommand = promisifiedRequestCommand; };
_.extend(RetryRequestHandler.prototype, AbstractCoRHandler,{

  handle: function () {
    return this.promisifiedRequestCommand.execute().then(methodDispatcher(this, "handleNext"));
  }
});

exports.AbstractCoRHandler = AbstractCoRHandler;
exports.ActiveSessionValidationHandler = ActiveSessionValidationHandler;
exports.LoggedOutHandler = LoggedOutHandler;
exports.RetryRequestHandler = RetryRequestHandler;