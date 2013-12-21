var moduleToTest  = "../../lib/handlers";
var chai        = require("chai");
var sinon       = require("sinon");
var sinonChai   = require("sinon-chai");

chai.use(sinonChai)
var should = chai.should()
var expect = chai.expect

var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var when = require("when");
var _ = require("underscore");

describe("sessioned-request", function () {
  describe("handlers", function () {
    var handlers = require(moduleToTest);
    describe("AbstractCoRHandler", function () {
      var AbstractCoRHandler = handlers.AbstractCoRHandler;
      var handler;
      var handler2;
      var CoRHandler = function (id) { this.id = id; };
      _.extend(CoRHandler.prototype, AbstractCoRHandler);
      beforeEach( function () {
        handler = new CoRHandler(1);
        handler2 = new CoRHandler(2);
        handler2.handle = sinon.spy();
        handler.setNextHandler(handler2);
      })
      it("#.setNextHandler() sets Next Handler and returns self.", function () {
        handler.setNextHandler().should.be.equal(handler);
      })
      it("#.next() should be able to retrieve the next handler.", function () {
        handler.next().should.be.equal(handler2);
      })
      it("#.handleNext() should be able to handle Next", function () {
        handler.handleNext({});
        handler2.handle.should.be.called;
      })
      describe("#.canHandleNext()", function () {
        describe("Given a Handler without next handler", function () {
          it("should return false", function () {
            handler.setNextHandler(undefined);
            handler.canHandleNext().should.be.equal(false);
          })
        })
        describe("Given a Handler and a Next Handler", function () {
          it("should return true", function () {
            handler.canHandleNext().should.be.equal(true);
          })
        })
      })
    })
    describe("ActiveSessionValidationHandler", function () {
      var ActiveSessionValidationHandler = handlers.ActiveSessionValidationHandler;
      var handler;
      beforeEach( function () {
        handler = new ActiveSessionValidationHandler();
      })
      it("can be instantiated", function () {
        new ActiveSessionValidationHandler();
      })
      it("and it implements CoR", function () {
        handler.should.have.property("setNextHandler");
        handler.should.have.property("handle");
      })
      describe("#.handle()", function () {
        var loginValidator;
        var response;
        beforeEach( function () {
          loginValidator = {validateLogin: function () { return true; }}
          response = {body: ""};
          handler = new ActiveSessionValidationHandler(loginValidator);
        })
        it("returns a promise", function () {
          handler.handle().should.have.property("then");
        })
        describe("Given a LoginValidator", function () {
          it("asks LoginValidator if session is active", function () {
            sinon.spy(loginValidator, "validateLogin");
            handler.handle();
            loginValidator.validateLogin.should.be.called;
          })
          it("with the Response object", function () {
            sinon.spy(loginValidator, "validateLogin");
            handler.handle(response);
            loginValidator.validateLogin.should.be.calledWith(response);
          })
          describe("When Session Active", function () {
            it("resolves to the response", function (done) {
              handler.handle(response).should.become(response).and.notify(done);
            })
          })
          describe("When Session inactive", function () {
            var nextHandler;
            beforeEach( function () {
              loginValidator.validateLogin = function () { return false; };
              nextHandler = {handle: function () {} };
              handler.setNextHandler(nextHandler);
              sinon.spy(nextHandler, "handle");
            })
            it("asks nextHandler to handle", function () {
              handler.handle(response);
              nextHandler.handle.should.be.called;
            })
            it("the Response", function () {
              handler.handle(response);
              nextHandler.handle.should.be.calledWith(response);
            })
            it("and it resolves to it's promise for handling", function () {
              var handledPromise = when.resolve("handled");
              nextHandler.handle = function () { return handledPromise; };
              handler.handle(response).should.be.equal(handledPromise);
            })
          })
        })
      })
    })

  })
})