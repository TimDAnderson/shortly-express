const models = require('../models');

var user;

var loginMiddleware = (req, res, next) => {
  console.log('now started login middleware');
  console.log(req.body.username);
  models.Users.get({ username: req.body.username })
    .then((userObject) => {
      if (userObject === undefined) {
        throw '';
      }

      user = userObject;
      console.log('about to update session');
      console.log(`username: ${userObject.username} user id: ${userObject.id}`);
      return models.Sessions.update({
        hash: req.session.hash
      }, {userId: user.id});
    })
    .then(() => {
      console.log('now redirecting');
      res.redirect('/');
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(err => {
      console.error(err);
      console.log('in the catch post login loop');
      res.redirect('/login');
    });
};

module.exports = loginMiddleware;
