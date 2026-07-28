//goal - stops the request and return 401
module.exports = (req, res, next) => {
  if (!global.user_id) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  next();
};