const models = require('../models');

var user;

var loginMiddleware = (req, res, next) => {
  //check if username exists
  models.Users.get({ username: req.body.username })
    .then((userObject) => {
      if (userObject === undefined) {
        throw '';
      }

      user = userObject;
      return models.Users.compare(req.body.password, userObject.password, userObject.salt);
    })
    .then(isMatch => {
      if (isMatch) {
        return models.Sessions.update({
          hash: req.session.hash
        }, {userId: user.id});
      } else {
        throw '';
      }
    })
    .then(() => {
      console.log('now redirecting');
      res.redirect('/');
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      console.log('in the catch post login loop');
      res.redirect('/login');
    });

  //get the salted password off the database
  //check if password is correct using the compare method
  //return cookie?
};

module.exports = loginMiddleware;
