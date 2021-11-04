const express = require('express');
const ensureAuthenticated = require('../middleware/ensureAuthenticated');
const Article = require('./../models/article');
const router = express.Router();

router.get('/new', ensureAuthenticated(), (req, res) => {
  res.render('articles/new', { article: new Article() });
});

router.get('/edit/:id', ensureAuthenticated(), async (req, res) => {
  const article = await Article.findById(req.params.id);
  res.render('articles/edit', { article: article });
});

router.get('/:slug', async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug });
  if (article == null) res.redirect('/');
  res.render('articles/show', { article: article });
});

router.post(
  '/',
  ensureAuthenticated(),
  async (req, res, next) => {
    req.article = new Article();
    next();
  },
  saveArticleAndRedirect('new')
);

router.put(
  '/:id',
  ensureAuthenticated(),
  async (req, res, next) => {
    const user = req.session.user;
    req.article = await Article.findById(req.params.id);
    if (req.article.author.id === user.id) next();
    else res.status(403).end();
  },
  saveArticleAndRedirect('edit')
);

router.delete('/:id', ensureAuthenticated(), async (req, res) => {
  const user = req.session.user;
  const article = await Article.findById(req.params.id);
  if (article.author.id === user.id) {
    await Article.findByIdAndDelete(req.params.id);
    res.redirect('/');
  } else res.status(403).end();
});

function saveArticleAndRedirect(path) {
  return async (req, res) => {
    let article = req.article;
    article.title = req.body.title;
    article.snippet = req.body.snippet;
    article.markdown = req.body.markdown;
    try {
      article.author = req.session?.user?._id ?? null;
      article = await article.save();
      res.redirect(`/articles/${article.slug}`);
    } catch (e) {
      console.log(e);
      res.render(`articles/${path}`, { article: article });
    }
  };
}

module.exports = router;
