var _ = require("underscore");
var when = require("when");
var formScraper = require("form-scraper");
var promisifiedRequest = require("promisified-request");

var LoginManager = function (options) { this.options = options ? options : {}; }
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
      return _SessionedRequest.doRequest(method, options.pReqCmd, options.responseHandler, arguments);
    }
  },

  doRequest: function (method, pReqCmd, responseHandler, args) {
    return pReqCmd[method].apply(pReqCmd, args)
      .execute()
      .then(methodDispatcher(responseHandler, "handle"));
  }
}

var SessionedRequest = function (options) { this.options = options ? options : {}; };
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
    return object[method].apply(object, arguments);
  };
}

var handlers = require("./lib/handlers");

exports.LoginManager = LoginManager;
exports.SessionedRequest = SessionedRequest;
exports.handlers = handlers;

function createResponseHandlerChain(loginValidator, loginManager, pReqCmd, errorProvider) {
  var responseHandler = new handlers.ActiveSessionValidationHandler(loginValidator);
  responseHandler.setNextHandler(new handlers.LoggedOutHandler(loginManager))
    .nextHandler.setNextHandler(new handlers.RetryRequestHandler(pReqCmd))
    .nextHandler.setNextHandler(new handlers.ActiveSessionValidationHandler(loginValidator))
    .nextHandler.setNextHandler(new handlers.ErrorRequestHandler(errorProvider));

  return responseHandler;
}

exports.createResponseHandlerChain = createResponseHandlerChain;

function createLoginManagerFromScratch (loginDetails, loginValidator, formSubmitter, errorProvider) {
  return new LoginManager({
    loginDetails: loginDetails,
    formSubmitter: formSubmitter,
    loginValidator: loginValidator,
    errorProvider: errorProvider
  });
}
exports.createLoginManagerFromScratch = createLoginManagerFromScratch;

function createLoginManager (loginDetails, formId, loginUrl, pRequest, loginValidator, errorProvider) {
  var formSubmitter = formScraper.createFormSubmitter(formId, loginUrl, pRequest);
  return createLoginManagerFromScratch(loginDetails, loginValidator, formSubmitter, errorProvider);
}

exports.createLoginManager = createLoginManager;

function createSessionedRequestFromScratch(pReqCmd, responseHandler) {
  return new SessionedRequest({
    pReqCmd: pReqCmd,
    responseHandler: responseHandler
  });
}
exports.createSessionedRequestFromScratch = createSessionedRequestFromScratch;

function createSessionedRequest (loginDetails, formId, loginUrl, pRequest, loginValidator, errorProvider) {
  var pReqCmd = new promisifiedRequest.PromisifiedRequestCommand(pRequest);
  var loginManager = createLoginManager(loginDetails, formId, loginUrl, pRequest, loginValidator, errorProvider);
  var responseHandler = createResponseHandlerChain(loginValidator, loginManager, pReqCmd, errorProvider);
  return createSessionedRequestFromScratch(pReqCmd, responseHandler);
}
exports.createSessionedRequest = createSessionedRequest;

function createSessionedRequestWithRequest (loginDetails, formId, loginUrl, request, loginValidator, errorProvider) {
  var pRequest = promisifiedRequest.create(request);
  return createSessionedRequest(loginDetails, formId, loginUrl, pRequest, loginValidator, errorProvider);
}
exports.createSessionedRequestWithRequest = createSessionedRequestWithRequest;