exports.handler = (req, res, next) => {
  let userId = req.query.userId || req.cookies.optimizelyEndUserId;
  if (userId) {
    console.log(`Got existing optimizelyUserId: ${userId}`);
  } else {
    // TODO: set cookie
    userId = `fs_demo-${Date.now()}.${Math.random()}`;
  }
  req.userId = userId;
  next();
};
