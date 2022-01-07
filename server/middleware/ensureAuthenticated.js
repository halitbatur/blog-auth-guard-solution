module.exports =
  (redirect = '/user/signin') =>
  (req, res, next) => {
    // Check if user session is active, that is if user is already authenticated
    if (!req.session?.user) {
      // As most get requests are page renders, we redirect to signin page if unauthenticated user tries to access any guarded page.
      if (req.method === 'GET') res.redirect(redirect);
      // For other operational requests, we send the HTTP 403 Forbidden response status code which indicates that the server refuses to authorize the request.
      else res.status(403).end();
    } else {
      next();
    }
  };

// The above syntax of chaining more than one function in a sequence is called currying.
// Our middleware function takes an argument called "redirect" and then returns another function.
// This other function is the standard express middleware format taking 3 arguments for request, response and next.
// Using this syntax enables us to use this middleware with a custom parameter for redirect link.
// We have set the default value of this parameter to '/user/signin'
// This means that when we pass the middleware as ensureAuthenticated(), it will use the default redirect value.
// And when we pass the middlware as ensureAuthenticated('some/other/route'), it will use the provided redirect value in the parameter.

// NOTE: We don't have any custom redirect scenarios in this assignment, so it is not required to use the currying syntax with redirect parameter.
