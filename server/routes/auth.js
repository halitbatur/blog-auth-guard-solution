const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const User = require('./../models/user');
const ensureAuthenticated = require('../middleware/ensureAuthenticated');

// Handles sign in request coming from sign in page
router.post('/signin', async (req, res) => {
  const { username, password, rememberMe } = req.body;

  // User must exist in the database for sign in request
  const user = await User.findOne({ username });
  if (!user) {
    return res
      .status(400)
      .render('user/signin', { error: 'Wrong username or password' });
  }

  // Use bcrypt compare to validate the plain text password sent in the request body with the hashed password stored in the database
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res
      .status(400)
      .render('user/signin', { error: 'Wrong username or password' });
  }

  // If password is valid, it's a sign in success
  // Return user details in response and session
  // Redirect to confirm sign in
  res.setHeader('user', user.id);
  // If user requested their sign in to be remembered, set session for 14 days. Otherwise it will be a one-time session.
  if (rememberMe) {
    req.session.cookie.maxAge = 14 * 24 * 3600 * 1000; // Value of 14 days in millseconds
  }
  req.session.user = user;
  res.redirect('/user/authenticated');
});

// Handles sign up request coming from sign up page
router.post('/signup', async (req, res) => {
  const {
    firstname,
    lastname,
    username,
    password,
    password2,
    acceptTos, // either "on" or undefined
    avatar,
  } = req.body;

  // Check password typed correctly by user twice
  if (password !== password2) {
    return res
      .status(400)
      .render('user/signup', { error: 'passwords do not match' });
  }

  // Check user accepted accept terms of services
  if (!acceptTos) {
    return res.status(400).render('user/signup', {
      error: "You haven't accepted terms of service",
    });
  }

  // User must not exist in the database for sign up request
  let user = await User.findOne({ username });
  if (user) {
    return res
      .status(400)
      .render('user/signup', { error: `${username}: username already used` });
  }

  // Use bcrypt to hash the user's plain text password with 10 salt rounds
  /* The higher the saltRounds value, the more time the hashing algorithm takes.
  You want to select a number that is high enough to prevent attacks,
  but not slower than potential user patience. We are using the default value, 10.
  */
  const password_hash = await bcrypt.hash(password, 10);

  // Create the user record on the database
  user = await User.create({
    firstname,
    lastname,
    username,
    avatar,
    password_hash,
  });

  // Once user record is created, it's a sign up success
  // Return user details in response and session
  // Redirect to confirm sign up
  res.setHeader('user', user.id);
  req.session.user = user;
  res.redirect('/user/authenticated');
});

// Handles sign out request
router.get('/signout', ensureAuthenticated('/'), (req, res) => {
  // Use express session destroy function which destroys the session and unsets the req.session property
  req.session.destroy();
  res.redirect('/');
});

// Renders sign up page
router.get('/signup', (req, res) => {
  // If user session is active, then they cannot sign up redirect to home page
  if (!req.session?.user) res.render('user/signup');
  else res.redirect('/');
});

// Renders sign in page
router.get('/signin', (req, res) => {
  // If user session is active, then they cannot sign in so redirect to home page
  if (!req.session?.user) res.render('user/signin');
  else res.redirect('/user/authenticated');
});

// Renders intermediate page after authentication which auto-redirects to home page after 3 seconds
router.get('/authenticated', ensureAuthenticated('/'), (req, res) => {
  res.render('user/authenticated');
});

module.exports = router;

/* NOTE: You can test your session cookies on the browser by opening the Network tab in the browser console.
Click on any of your implemented auth routes in the network tab records when they are executed.
Once the route details open up, verify cookie details in the Cookies tab.
*/
