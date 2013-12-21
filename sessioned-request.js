var _ = require("underscore");
var when = require("when");

var LoginManager = function () {}
_.extend(LoginManager.prototype, {

  login: function () {
    var that = this;
    return this.options.
      formSubmitter
        .submitForm(this.options.loginDetails)
        .then( function (response) {
          if (!that.options.loginValidator.validateLogin(response)) {
            return when.reject(that.options.errorProvider.whatHappened(response));
          }

          return when.resolve(true);
        });
  },

  updateOptions: function (options) {
    this.options = _.extend({}, this.options, options);
    return this;
  }
});

var _SessionedRequest = {
  makeFuncForMethod: function (method) {
    return function () {
      var options = this.options;
      return _SessionedRequest.doRequest(method, options.promisedRequestCommand, options.responseHandler, arguments);
    }
  },

  doRequest: function (method, promisedRequestCommand, responseHandler, args) {
    return promisedRequestCommand[method].apply(promisedRequestCommand, args)
      .execute()
      .then(methodDispatcher(responseHandler, "handle"));
  }
}

var SessionedRequest = function () {};
_.extend(SessionedRequest.prototype, {
  get: _SessionedRequest.makeFuncForMethod("get"),
  post: _SessionedRequest.makeFuncForMethod("post"),

  updateOptions: function (options) {
    this.options = _.extend({}, this.options, options);
    return this;
  }
});


function methodDispatcher(object, method) {
  return function () {
    object[method].apply(object, arguments);
  };
}

exports.LoginManager = LoginManager;
exports.SessionedRequest = SessionedRequest;