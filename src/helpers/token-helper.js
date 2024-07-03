const { v4: uuid } = require('uuid')
const jwt = require('jsonwebtoken')
const { jwt: tokenConfig } = require('../config')

const generateToken = (
  payload,
  secret = tokenConfig.secret,
  expiration = tokenConfig.expiration
) => {
  const options = {
    expiresIn: expiration || tokenConfig.expiration || '1h'
  }
  return jwt.sign(
    { ...payload, timestamp: new Date().getTime() },
    secret || tokenConfig.secret,
    options
  )
}

const verifyToken = (token, secret = tokenConfig.secret) => {
  token = `${token}`.replace('Bearer ', '')

  return jwt.verify(token, secret)
}

const generateRefreshToken = () => {
  return uuid().replace(/-/g, '')
}

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken
}
