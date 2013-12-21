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

exports.LoginManager = LoginManager;