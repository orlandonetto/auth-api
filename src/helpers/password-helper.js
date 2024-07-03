const bcrypt = require('bcrypt')

const encryptPassword = async (rawPass, salt = 10) => {
  return bcrypt.hash(rawPass, salt)
}

const comparePassword = async (rawPass, hashedPass) => {
  return bcrypt.compare(rawPass, hashedPass)
}

module.exports = {
  encryptPassword, comparePassword
}
