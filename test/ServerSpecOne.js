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

  describe('Privileged Access:', function () {

    it('Redirects to login page if a user tries to access the main page and is not signed in', function (done) {
      request('http://127.0.0.1:4568/', function (error, res, body) {
        console.log('finished getting index');
        // console.log(res.req.path);
        if (error) { return done(error); }
        expect(res.req.path).to.equal('/login');
        done();
      });
    });
  });
});