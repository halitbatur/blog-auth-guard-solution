module.exports =
  (redirect = '/user/signin') =>
  (req, res, next) => {
    if (!req.session?.user) {
      if (req.method === 'GET') res.redirect(redirect);
      else res.status(403).end();
    } else {
      next();
    }
  };
