const express = require('express');
const User = require('./../models/user');
const bcrypt = require('bcrypt');
const router = express.Router();

router.post('/signin', async (req, res) => {
  const { username, password, rememberMe } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res
      .status(400)
      .render('user/signin', { error: 'Wrong username or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res
      .status(400)
      .render('user/signin', { error: 'Wrong username or password' });
  }

  res.setHeader('user', user.id);
  if (rememberMe) {
    req.session.cookie.maxAge = 14 * 24 * 3600 * 1000; // 14 days
  }
  req.session.user = user;
  res.redirect('/user/authenticated');
});

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

  // Check password quality
  if (password !== password2) {
    return res
      .status(400)
      .render('user/signup', { error: 'passwords do not match' });
  }

  // Check accept tos
  if (!acceptTos) {
    return res.status(400).render('user/signup', {
      error: "You haven't accepted terms of service",
    });
  }

  // Check username is unique
  let user = await User.findOne({ username });
  if (user) {
    return res
      .status(400)
      .render('user/signup', { error: `${username}: username already used` });
  }

  const password_hash = await bcrypt.hash(password, 10);

  user = await User.create({
    firstname,
    lastname,
    username,
    avatar,
    password_hash,
  });

  req.session.user = user;

  res.redirect('/user/authenticated');
});

router.get('/signout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// renders sign up page
router.get('/signup', (req, res) => {
  res.render('user/signup');
});

// renders sign in page
router.get('/signin', (req, res) => {
  res.render('user/signin');
});

router.get('/authenticated', (req, res) => {
  res.render('user/authenticated');
});

module.exports = router;
