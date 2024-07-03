const { EmailTemplates } = require('../../enums/global.enums')
const { generateRandomString } = require('../../helpers/string-helper')
const { sendEmail } = require('../../services/email')
const templates = require('../../services/email/templates')
const {
  existsByEmailConfirmationCode,
  existsByRecoverPassCode, findByUserID, updateUser
} = require('./users.dao')
const config = require('../../config')
const { generateToken, generateRefreshToken } = require('../../helpers/token-helper')
const { createToken } = require('../tokens/tokens.dao')
const { generateExpiresIn } = require('../tokens/tokens.helper')
const moment = require('moment/moment')

const sendConfirmationEmail = async ({ email, name, code }) => {
  const html = templates[EmailTemplates.ConfirmationEmail]
    .replace('{{name}}', name)
    .replace('{{code}}', code)

  await sendEmail(
    email,
    'Confirme seu e-mail' /* TODO: i18n */,
    html
  )
}

const sendRecoverPassEmail = async ({ email, token }) => {
  const { baseURL } = config.client
  const url = `${baseURL}/recover-pass?token=${token}`

  const template = templates[EmailTemplates.RecoverPassword]
  const html = template.replace('{{url}}', url)

  await sendEmail(
    email,
    'Recupere sua senha' /* TODO: i18n */,
    html
  )
}

const generateEmailConfirmationCode = async () => {
  const code = generateRandomString(4).toUpperCase()

  const exists = await existsByEmailConfirmationCode(code)
  if (!exists) {
    return code
  }

  return generateEmailConfirmationCode()
}

const generateRecoverPassCode = async () => {
  const code = generateRandomString(4).toUpperCase()

  const exists = await existsByRecoverPassCode(code)
  if (!exists) {
    return code
  }

  return generateRecoverPassCode()
}

const processLogin = async ({ userID, realmID }) => {
  userID = userID.toString()
  realmID = realmID.toString()

  const user = await findByUserID(userID)
  const { email } = user

  const accessToken = generateToken({ userID, email })
  const refreshToken = generateRefreshToken()

  await createToken({
    userID,
    realmID,
    accessToken,
    refreshToken,
    expiresIn: generateExpiresIn()
  })

  return {
    accessToken,
    refreshToken,
    user
  }
}

const processResendEmailConfirmation = async (user) => {
  const { _id: userID, email, firstName: name } = user

  const code = await generateEmailConfirmationCode()

  await updateUser(userID, {
    emailConfirmationCode: code,
    emailConfirmationSentDate: new Date()
  })

  sendConfirmationEmail({
    email,
    name,
    code
  })

  const sendDate = moment().format('YYYY-MM-DD HH:mm:ss Z')
  const blockedDate = moment().add(7, 's').format('YYYY-MM-DD HH:mm:ss Z')

  return {
    sendDate,
    blockedDate
  }
}

module.exports = {
  sendConfirmationEmail,
  sendRecoverPassEmail,
  generateEmailConfirmationCode,
  generateRecoverPassCode,
  processLogin,
  processResendEmailConfirmation
}
