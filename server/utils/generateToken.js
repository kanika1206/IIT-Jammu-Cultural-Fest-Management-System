const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (id, role, teamId) => {
  return jwt.sign({ id, role, teamId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;