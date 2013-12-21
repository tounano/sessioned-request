var moduleToTest  = "../sessioned-request";
var chai        = require("chai");
var sinon       = require("sinon");
var sinonChai   = require("sinon-chai");

chai.use(sinonChai)
var should = chai.should()
var expect = chai.expect

var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var when = require("when");

describe("sessioned-request", function () {
  var sRequest = require(moduleToTest);
  describe("LoginManager", function () {
    var LoginManager = sRequest.LoginManager;
    it("can be created with `new`", function () {
      new LoginManager()
    })
    describe("Given a new instance of LoginManager", function () {
      var loginManager;
      beforeEach( function () {
        loginManager = new LoginManager();
      })
      describe("#.updateOptions()", function () {
        it("returns itself", function () {
          loginManager.updateOptions({}).should.be.equal(loginManager);
        })
      })
      describe("#.login()", function () {
        var formSubmitter;
        var loginValidator;
        var options;
        var loginPromise;
        beforeEach( function () {
          formSubmitter = { submitForm: when.resolve };
          loginValidator = { validateLogin: function () { return true; }};
          options = { formSubmitter: formSubmitter, loginValidator: loginValidator };
          loginManager.updateOptions(options);
        })
        it("returns a promise", function () {
          loginManager.login().should.have.property("then");
        })
        describe("Given a `formSubmitter` and `loginValidator`", function () {
          beforeEach( function () {
            sinon.spy(formSubmitter, "submitForm");
          })
          it("logs in by submitting the login form", function () {
            loginManager.login();
            formSubmitter.submitForm.should.be.called;
          })
          it("with `loginDetails`", function () {
            var loginDetails = { username: "", password: "" };
            loginManager.updateOptions({loginDetails: loginDetails}).login();
            formSubmitter.submitForm.should.be.calledWith(loginDetails);
          })
          it("and validates if the login was successful", function (done) {
            sinon.spy(loginValidator, "validateLogin");
            loginManager.login().then( function () {
              loginValidator.validateLogin.should.be.called;
            }).should.notify(done);
          })
          describe("When a login attempt failed", function () {
            var error;
            var errorProvider;
            beforeEach( function () {
              loginValidator.validateLogin = function () { return false; }
              error = new Error("LOGIN ERROR");
              errorProvider = {whatHappened: function () {return error }};
              loginManager.updateOptions({errorProvider: errorProvider});
              sinon.spy(errorProvider, "whatHappened");
            })
            it("returns a rejected promise.", function (done) {
              loginManager.login().should.be.rejected.and.notify(done);
            })
            it("Asks ErrorProvider", function (done) {
              loginManager.login().then(null, function () {
                errorProvider.whatHappened.should.be.called;
              }).should.notify(done);
            })
            it("to give a reason for the rejection", function (done) {
              loginManager.login().should.be.rejectedWith(error).and.notify(done);
            })
          })
          describe("When a login attempt succeeded", function () {
            it("resolves to true", function (done) {
              loginManager.login().should.become(true).and.notify(done);
            })
          })
        })
      })
    })
  })
  describe("SessionedRequest", function () {
    var SessionedRequest = sRequest.SessionedRequest;
    it("can be instantiated", function () {
      new SessionedRequest();
    })
    describe("Given a new instance of SessionedRequest", function () {
      var session = new SessionedRequest();
      describe("#.updateOptions()", function () {
        it("should return itself", function () {
          session.updateOptions().should.be.equal(session);
        })
      })
      var promisedRequestCommand;
      var responseHandler;
      var command;
      beforeEach( function () {
        command = {execute: when.resolve}
        promisedRequestCommand = {get: function() { return command } };
        session.updateOptions({promisedRequestCommand: promisedRequestCommand});
        responseHandler = {handle: when.resolve };
        session.updateOptions({ responseHandler: responseHandler })
      })
      describe("#.get()", function () {
        it("returns a promise", function () {
          session.get().should.have.property("then");
        })
        describe("Given a PromisedRequestCommand", function () {
          it("performs .get() on promisedRequest", function () {
            sinon.spy(promisedRequestCommand, "get");
            session.get();
            promisedRequestCommand.get.should.be.called;
          })
          it("with the same arguments", function () {
            sinon.spy(promisedRequestCommand, "get");
            session.get("URL");
            promisedRequestCommand.get.should.be.calledWith("URL");
          })
          it("and Executes the request", function () {
            sinon.spy(command, "execute");
            session.get("");
            command.execute.should.be.called;
          })
          it("and calls ResponseHandler", function (done) {
            sinon.spy(responseHandler, "handle");
            session.get().then( function () {
              responseHandler.handle.should.be.called;
            }).should.notify(done);
          })
        })
      })
      describe("#.post()", function () {
        it("returns a promise", function () {
          session.post().should.have.property("then");
        })
      })
    })
  })
})