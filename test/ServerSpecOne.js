var expect = require('chai').expect;
var mysql = require('mysql');
var request = require('request');
var httpMocks = require('node-mocks-http');

var app = require('../server/app.js');
var schema = require('../server/db/config.js');
var port = 4568;

/************************************************************/
// Mocha doesn't have a way to designate pending before blocks.
// Mimic the behavior of xit and xdescribe with xbeforeEach.
// Remove the 'x' from beforeEach block when working on
// authentication tests.
/************************************************************/
var xbeforeEach = function () { };
/************************************************************/


describe('', function () {
  var db;
  var server;

  var clearDB = function (connection, tablenames, done) {
    var count = 0;
    tablenames.forEach(function (tablename) {
      connection.query('DROP TABLE IF EXISTS ' + tablename, function () {
        count++;
        if (count === tablenames.length) {
          return schema(db).then(done);
        }
      });
    });
  };

  beforeEach(function (done) {

    /*************************************************************************************/
    /* TODO: Update user and password if different than on your local machine            */
    /*************************************************************************************/
    db = mysql.createConnection({
      user: 'root',
      database: 'shortly'
    });

    /**************************************************************************************/
    /* TODO: If you create a new MySQL tables, add it to the tablenames collection below. */
    /**************************************************************************************/
    var tablenames = ['links', 'clicks', 'users', 'sessions'];

    db.connect(function (err) {
      if (err) { return done(err); }
      /* Empties the db table before each test so that multiple tests
       * (or repeated runs of the tests) won't screw each other up: */
      clearDB(db, tablenames, function () {
        server = app.listen(port, done);
      });
    });

    afterEach(function () { server.close(); });
  });

  describe('Express Middleware', function () {
    var cookieParser = require('../server/middleware/cookieParser.js');
    var createSession = require('../server/middleware/auth.js').createSession;

    describe('Session Parser', function () {

      it('clears and reassigns a new cookie if there is no session assigned to the cookie', function (done) {
        var maliciousCookieHash = '8a864482005bcc8b968f2b18f8f7ea490e577b20';
        var response = httpMocks.createResponse();
        var requestWithMaliciousCookie = httpMocks.createRequest();
        requestWithMaliciousCookie.cookies.shortlyid = maliciousCookieHash;

        createSession(requestWithMaliciousCookie, response, function () {
          var cookie = response.cookies.shortlyid;
          expect(cookie).to.exist;
          expect(cookie).to.not.equal(maliciousCookieHash);
          done();
        });
      });
    });
  });
});