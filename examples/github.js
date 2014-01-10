
var sRequest = require("../sessioned-request");

var loginDetails = require("../config.json");

// config.json looks like that
//{
//  "login": "github login",
//  "password": "github password"
//}


// Uses fiddler proxy
var request = require("request").defaults({"followAllRedirects": true, jar: true, "proxy": "http://127.0.0.1:8888"});

// an Object that validates the login status. Should implement #.validateLogin() method
var GithubloginValidator = {
  validateLogin: function (response) {
    return (response.request.uri.pathname != "/login" && response.request.uri.pathname != "/session")
  }
}

// an Object that provides an error or reason on failed attempts. Can scrape a message box from the response.
var GithubErrorProvider = {
  provideError: function (response) { return new Error("Can't login... ") }
}

// So it'll be able to pass fiddlers certificate
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// Rock and Roll!!!
var gitHubRequest = sRequest.createSessionedRequestWithRequest(loginDetails,"#login form", "https://github.com/login", request, GithubloginValidator, GithubErrorProvider);
gitHubRequest.get('https://github.com/settings/profile').then(function (r) { console.log(r.request.uri) }, console.log);
