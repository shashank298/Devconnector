const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  //Check if token is present
  const token = req.header('auth-token');

  //if token is not present
  if (!token) {
    res.status(500).json({ msg: 'no token,access denied' });
  }

  //verify token if present
  try {
    const decode = jwt.verify(token, config.get('jwtSecret'));
    req.user = decode.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'token is not valid' });
  }
};
