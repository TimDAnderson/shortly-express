var expect = require('chai').expect;

module.exports = (db) => {
  console.log('db was passed to databaseSchema');
  console.log(db);
  return function () {
    it('contains a users table', function (done) {
      var queryString = 'SELECT * FROM users';
      db.query(queryString, function (err, results) {
        if (err) { return done(err); }

        expect(results).to.deep.equal([]);
        done();
      });
    });

    it('contains id, username, password columns', function (done) {
      var newUser = {
        username: 'Howard',
        password: 'p@ssw0rd'
      };
      db.query('INSERT INTO users SET ?', newUser, function (err, results) {
        db.query('SELECT * FROM users WHERE username = ?', newUser.username, function (err, results) {
          var user = results[0];
          expect(user.username).to.exist;
          expect(user.password).to.exist;
          expect(user.id).to.exist;
          done();
        });
      });
    });

    it('only allows unique usernames', function (done) {
      var newUser = {
        username: 'Howard',
        password: 'p@ssw0rd'
      };
      db.query('INSERT INTO users SET ?', newUser, function (err, results) {
        var sameUser = newUser;
        db.query('INSERT INTO users SET ?', sameUser, function (err) {
          expect(err).to.exist;
          expect(err.code).to.equal('ER_DUP_ENTRY');
          done();
        });
      });
    });

    it('should increment the id of new rows', function (done) {
      var newUser = {
        username: 'Howard',
        password: 'p@ssw0rd'
      };
      db.query('INSERT INTO users SET ?', newUser, function (error, result) {
        var newUserId = result.insertId;
        var otherUser = {
          username: 'Muhammed',
          password: 'p@ssw0rd'
        };
        db.query('INSERT INTO users SET ?', otherUser, function (err, results) {
          var userId = results.insertId;
          expect(userId).to.equal(newUserId + 1);
          done(error || err);
        });
      });
    });
  };
};