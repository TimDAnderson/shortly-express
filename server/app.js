const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const cookieParser = require('./middleware/cookieParser');
const models = require('./models');
const login = require('./middleware/login');
var globalUsername;

//passport for github login
var methodOverride = require('method-override');
var apiKeys = require('./API_keys');
var GITHUB_CLIENT_ID = apiKeys.GITHUB_CLIENT_ID;
var GITHUB_CLIENT_SECRET = apiKeys.GITHUB_CLIENT_SECRET;
console.log('this is the github client ID and seceret');
console.log(GITHUB_CLIENT_ID);
console.log(GITHUB_CLIENT_SECRET);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// Use the GitHubStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and GitHub
//   profile), and invoke a callback with a user object.
passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: 'http://127.0.0.1:4568/auth/github/callback'
},
function (accessToken, refreshToken, profile, done) {
  // asynchronous verification, for effect...
  process.nextTick(function () {

    console.log('profile.username');
    console.log(profile.username);
    globalUsername = profile.username;
    // To keep the example simple, the user's GitHub profile is returned to
    // represent the logged-in user.  In a typical application, you would want
    // to associate the GitHub account with a user record in your database,
    // and return that user instead.
    return done(null, profile);
  });
}
));

var ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
};



//end passport for github login


const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, '../public')));

app.use(cookieParser);
app.use(Auth.createSession);

//adding the github routes to express js
// GET /auth/github
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in GitHub authentication will involve redirecting
//   the user to github.com.  After authorization, GitHub will redirect the user
//   back to this application at /auth/github/callback
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }),
  function (req, res) {
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  });

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    //res.redirect('/'); //around this spot we're routing back into our app from github.  Now we can query db for existing user
    console.log('now in the auth github callback route');
    models.Users.get({ username: globalUsername })
      .then(user => {
        if (user) {
          //dont create new user
          // before we redirect we have to add globalUsername to req.session
          console.log('got existing user');
          return user;
        } else {
          console.log('no user found');
          return models.Users.create({ // expecting this to return a promise.
            username: globalUsername //,
            // password: req.body.password
          });
        }
      })
      .then(()=>{
        console.log('finished checking user table');
        req.session.user = globalUsername;
        console.log(`typeof login: ${typeof login} login: ${login}`);
      });
  }, login);





//ending the github routes

app.get('/', Auth.verifySession,
  (req, res) => {
    res.render('index');
  });

app.get('/create', Auth.verifySession,
  (req, res) => {
    res.render('index');
  });

app.get('/links', Auth.verifySession,
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

//post signup
app.post('/signup', (req, res, next) => {
  //we're going to have req.body.username
  // and req.body.password

  //we're goign to have to generate a salt string
  //models.Users.create
  models.Users.get({ username: req.body.username })
    .then(user => {
      if (user) {
        // redirect
        res.redirect('/signup');
        throw {};
      } else {
        // create
        return models.Users.create({ // expecting this to return a promise.
          username: req.body.username,
          password: req.body.password
        });
      }
    })
    .then(() => {
      next();
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(err => {
      console.error(err);
    });

  //logging in or remaining logged in?
}, login);

app.get('/login', (req, res, next) => {
  res.render('index');
});

//post login
app.post('/login', login);

app.get('/logout', (req, res, next) => {
  //req object should have session object
  //req object should have cookie object

  //remove the session from the session table
  //logs them out
  //use the delete method in models.js
  //delete takes in options object where the keys are column and
  //the values are the current values
  models.Sessions.delete({ hash: req.session.hash })
    .then(() => {
      res.header('Set-Cookie', 'shortlyid=' + '');
    })
    .then(() => {
      res.redirect('/');
    })
    .catch((err) => {
      console.error(err);
      res.redirect('/');
    });

});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
