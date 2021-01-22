const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const cookieParser = require('./middleware/cookieParser');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use(cookieParser);
app.use(Auth.createSession);


app.get('/',
  (req, res) => {
    res.render('index');
  });

app.get('/create',
  (req, res) => {
    res.render('index');
  });

app.get('/links',
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
      return models.Users.get({
        username: req.body.username
      });
    })
    .then(user => {
      return models.Sessions.update({
        hash: req.session.hash
      }, { userId: user.id });
    })
    .then(rowsAffected => {
      res.status(200).redirect('/');
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(err => {
      console.error(err);
    });

  //logging in or remaining logged in?
});



//post login
app.post('/login', (req, res, next) => {
  //check if username exists
  models.Users.get({ username: req.body.username })
    .then((userObject) => {
      if (userObject === undefined) {
        throw '';
      }

      return models.Users.compare(req.body.password, userObject.password, userObject.salt);
    })
    .then(isMatch => {
      if (isMatch) {
        res.redirect('/');
      } else {
        throw '';
      }
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/login');
    });

  //get the salted password off the database
  //check if password is correct using the compare method
  //return cookie?


});

app.get('/logout', (req, res, next) => {
  //req object should have session object
  //req object should have cookie object

  //remove the session from the session table
  //logs them out
  //use the delete method in models.js
  //delete takes in options object where the keys are column and
  //the values are the current values
  models.Sessions.delete({hash: req.session.hash})
    .then(()=>{
      res.header('Set-Cookie', 'shortlyid=' + '');
    })
    .then(()=>{
      res.redirect('/');
    })
    .catch((err)=>{
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
