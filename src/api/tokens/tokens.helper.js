const moment = require('moment')
const { jwt: tokenConfig } = require('../../config')
const { separateNumbersAndLetters } = require('../../helpers/string-helper')

const generateExpiresIn = (expiration = tokenConfig.expirationRefresh) => {
  const {
    numbers: amount,
    letters: unit
  } = separateNumbersAndLetters(expiration)

  return moment().add(amount, unit || 'milliseconds').toDate()
}

module.exports = { generateExpiresIn }
