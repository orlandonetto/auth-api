const helper = require('./tokens.helper')
const moment = require('moment')

describe('Generate expires in date', () => {
  const format = 'YYYY-MM-DD HH:mm'

  it('when expiresIn is a "xh" format must be added x hours in expiresIn', () => {
    const expAmount = '1'
    const expUnit = 'h'
    const expiration = `${expAmount}${expUnit}` // 1h
    const expiresIn = helper.generateExpiresIn(expiration)
    const formattedExpiresIn = moment(expiresIn).format(format)
    const formattedResult = moment().add(1, 'h').format(format)

    expect(formattedExpiresIn).toBe(formattedResult)
  })

  it('when expiresIn is a "xxxxxx" format must be added xxxxxx milliseconds in expiresIn', () => {
    const expiration = '3600000' // 1h
    const expiresIn = helper.generateExpiresIn(expiration)
    const formattedExpiresIn = moment(expiresIn).format(format)
    const formattedResult = moment().add(expiration, null).format(format)

    expect(formattedExpiresIn).toBe(formattedResult)
  })
})
