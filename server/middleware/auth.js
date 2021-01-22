const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  // we know the request object has the cookies attached
  if (Object.keys(req.cookies).length > 0 && 'shortlyid' in req.cookies) {
    //if it has a cookie
    // verify the cookie is valid, using the hash?
    models.Sessions.get({ hash: req.cookies.shortlyid })
      .then(session => {
        if (session === undefined) {
          // this cookie is invalid
          models.Sessions.create()
            .then(result => {
              if (!res.headersSent) {
                res.header('Set-Cookie', 'shortlyid=' + result.hash);
              }

              // add the session property to req
              req.session = { hash: result.hash };

              res.cookies = { shortlyid: { value: result.hash } };
              next();
            })
            .catch((err) => {
              console.error(err);
            });
        } else {
          // valid cookie
          req.session = {
            hash: req.cookies.shortlyid,
            user: session.user,
            userId: session.userId
          };
          //take the cookie
          //run it through our database
          //tell us the id and password
          //this get assigned to the session object
          next();
        }
      });
  } else {
    // if no cookie
    // generate a session with a unique hash and store in sessions database
    models.Sessions.create()
      .then(result => {
        if (!res.headersSent) {
          res.header('Set-Cookie', 'shortlyid=' + result.hash);
        }
        // add the session property to req
        req.session = { hash: result.hash };

        res.cookies = { shortlyid: { value: result.hash } };
        next();
      });
  }

  //we can look for shortly cookie


  //if it has a cookie, and it is not valid
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

