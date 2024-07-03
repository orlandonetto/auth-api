const AppError = require('../../errors/AppError')
const { comparePassword } = require('../../helpers/password-helper')
const {
  generateToken,
  generateRefreshToken
} = require('../../helpers/token-helper')
const { createToken, removeToken } = require('../tokens/tokens.dao')
const { generateExpiresIn } = require('../tokens/tokens.helper')
const dao = require('./users.dao')
const {
  sendConfirmationEmail,
  generateEmailConfirmationCode,
  sendRecoverPassEmail,
  generateRecoverPassCode, processLogin, processResendEmailConfirmation
} = require('./users.helper')
const { getKeysDiff } = require('../../helpers/object-helper')

const createUser = async (request, response) => {
  const { body } = request

  try {
    const emailConfirmationCode = await generateEmailConfirmationCode()

    const user = await dao.createUser({ ...body, emailConfirmationCode })

    sendConfirmationEmail({
      email: user.email,
      name: user.firstName,
      code: emailConfirmationCode
    })

    return response.status(201).json(user)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError('Falha ao criar usuário', error, 500) // TODO: i18n
  }
}

const confirmEmail = async (req, res) => {
  try {
    const {
      locals: {
        realm: { _id: realmID },
        user: { _id: userID }
      }
    } = req

    await dao.updateUser(userID, { emailConfirmed: true })

    const { accessToken, refreshToken, user } = await processLogin({ userID, realmID })

    return res.status(200).json({
      accessToken,
      refreshToken,
      user
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError('Falha ao confirmar email', error, 500) // TODO: i18n
  }
}

const confirmEmailResend = async (req, res) => {
  try {
    const {
      locals: { user }
    } = req

    const { sendDate, blockedDate } = await processResendEmailConfirmation(user)

    return res.status(200).json({
      sendDate,
      blockedDate
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError('Falha ao reenviar email de confirmação', error, 500) // TODO: i18n
  }
}

const login = async (request, response) => {
  const {
    body,
    locals: { realm: { _id: realmID } }
  } = request

  try {
    const userCredentials = await dao.fetchPasswordByEmail(body.email)

    const passwordMatch =
        !!userCredentials &&
        (await comparePassword(body.password, userCredentials.password))

    if (!passwordMatch) {
      throw new AppError(
        'Email ou senha inválida.', // TODO: i18n
        new Error(),
        400
      )
    }

    const { _id: userID } = userCredentials
    const { accessToken, refreshToken, user } = await processLogin({ userID, realmID })

    return response.status(200).json({
      accessToken,
      refreshToken,
      user
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao realizar login', // TODO: i18n
      error,
      500
    )
  }
}

const logout = async (request, response) => {
  const {
    locals: {
      tokens: { accessToken }
    }
  } = request

  try {
    await removeToken(accessToken)

    return response.status(204).end()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao realizar logout', // TODO: i18n
      error,
      500
    )
  }
}

const refreshTokens = async (request, response) => {
  const {
    locals: { tokens, user, realm }
  } = request

  try {
    const accessToken = generateToken({
      userID: user._id.toString(),
      email: user.email
    })

    const refreshToken = generateRefreshToken()

    await createToken({
      userID: user._id,
      realmID: realm._id,
      accessToken,
      refreshToken,
      expiresIn: generateExpiresIn()
    })

    // Desabilitando e removendo token antigo
    await removeToken(tokens.accessToken)

    return response.status(200).json({
      accessToken,
      refreshToken
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao atualizar tokens', // TODO: i18n
      error,
      500
    )
  }
}

const getMe = async (request, response) => {
  const {
    locals: { user }
  } = request

  response.status(200).json(user)
}

const recoverPasswordRequest = async (request, response) => {
  const {
    locals: { user }
  } = request

  try {
    const { _id: userID, email } = user

    const code = await generateRecoverPassCode()
    const token = generateToken({ email, code })

    await dao.updateUser(userID, {
      recoverPassCode: code,
      recoverPassSentDate: new Date()
    })

    sendRecoverPassEmail({ email: user.email, token })

    return response.status(204).end()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao solicitar recuperação de senha', // TODO: i18n
      error,
      500
    )
  }
}

const recoverPassword = async (request, response) => {
  const {
    locals: {
      user: { _id: userID }
    },
    body: { password }
  } = request

  try {
    await dao.updateUser(userID, {
      password,
      recoverPassCode: null,
      recoverPassSentDate: null
    })

    return response.status(204).end()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao realizar a recuperação da senha', // TODO: i18n
      error,
      500
    )
  }
}

const updateProfile = async (request, response) => {
  const {
    body,
    locals: { user }
  } = request

  const { _id: userID } = user

  try {
    const keysDiff = getKeysDiff(user, body)

    if (!keysDiff || !keysDiff.length) {
      throw new AppError(
        'Não há dados diferentes para atualizar.', // TODO: i18n
        new Error(),
        304
      )
    }

    const payload = {}

    keysDiff.forEach((key) => Object.assign(payload, { [key]: body[key] }))

    await dao.updateUser(userID, payload)
    const updatedUser = await dao.findByUserID(userID)

    return response.status(200).json(updatedUser)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao atualizar o perfil do usuário', // TODO: i18n
      error,
      500
    )
  }
}

module.exports = {
  createUser,
  login,
  logout,
  refreshTokens,
  getMe,
  confirmEmail,
  confirmEmailResend,
  recoverPasswordRequest,
  recoverPassword,
  updateProfile
}
