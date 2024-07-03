const { celebrate, Joi, Segments } = require('celebrate')
const { findUserByEmail, findByUserID, fetchUsers } = require('./users.dao')
const { verifyToken } = require('../../helpers/token-helper')
const { findByAccessToken, fetchTokens } = require('../tokens/tokens.dao')
const AppError = require('../../errors/AppError')
const moment = require('moment')
const { findRealmByID } = require('../realms/realms.dao')
const { JsonWebTokenError } = require('jsonwebtoken')
const { processResendEmailConfirmation } = require('./users.helper')

const authenticate = async (request, _, next) => {
  try {
    const {
      headers: { authorization }
    } = request

    const { userID } = verifyToken(authorization)

    const user = await findByUserID(userID)
    if (!user) {
      throw new AppError(
        'Usuário não encontrado', // TODO: i18n
        new Error(),
        401
      )
    }

    const tokens = await findByAccessToken(
      authorization.replace('Bearer ', '')
    )
    if (!tokens) {
      throw new AppError(
        'Tokens não encontrado', // TODO: i18n
        new Error(),
        401
      )
    }

    request.locals.user = user
    request.locals.tokens = tokens

    next()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao autenticar usuário', // TODO: i18n
      error,
      401
    )
  }
}

const validateCreateUserSchema = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email({ minDomainSegments: 2 }).required(),
    password: Joi.string().min(6).max(60).required(),
    firstName: Joi.string().min(2).max(30).trim().required(),
    lastName: Joi.string().min(2).max(30).trim().required()
  })
})

const validateLoginSchema = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email({ minDomainSegments: 2 }).required(),
    password: Joi.string().required(),
    realmID: Joi.string().required()
  })
})

const validateRefreshTokensSchema = celebrate({
  [Segments.BODY]: Joi.object({
    refreshToken: Joi.string().required()
  })
})

const validateConfirmEmailSchema = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email({ minDomainSegments: 2 }).required(),
    emailConfirmationCode: Joi.string().uppercase().required(),
    realmID: Joi.string().required()
  })
})

const validateConfirmEmailResendSchema = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email({ minDomainSegments: 2 }).required()
  })
})

const validadeRecoverPasswordRequestSchema = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email({ minDomainSegments: 2 }).required()
  })
})

const validadeRecoverPasswordSchema = celebrate({
  [Segments.BODY]: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).max(60).required()
  })
})

const validateUserNotExistence = async (req, _, next) => {
  const user = await findUserByEmail(req.body.email)

  if (user) {
    throw new AppError(
      'Email já está em uso. Por favor, informe um email diferente.', // TODO: i18n
      new Error(),
      400
    )
  }

  next()
}

const validateUserExistenceByEmail = async (request, _, next) => {
  try {
    const {
      body: { email }
    } = request

    const user = await findUserByEmail(email)
    if (!user) {
      throw new AppError(
        'Usuário nao encontrado', // TODO: i18n
        new Error(),
        404
      )
    }

    request.locals.user = user

    next()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao confirmar email do usuário', // TODO: i18n
      error,
      500
    )
  }
}

const validateUserNotEmailConfirmed = async (request, _, next) => {
  try {
    const {
      body: { email }
    } = request

    const user = request.locals.user || (await findUserByEmail(email))
    if (!user) {
      throw new AppError(
        'Usuário nao encontrado', // TODO: i18n
        new Error(),
        404
      )
    }

    if (user.emailConfirmed) {
      throw new AppError(
        'Email já está validado', // TODO: i18n
        new Error(),
        304
      )
    }

    if (!request.locals.user) {
      request.locals.user = user
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao confirmar email do usuário', // TODO: i18n
      error,
      500
    )
  }
}

const validateUserEmailSentDate = async (request, _, next) => {
  try {
    const {
      locals: { user }
    } = request

    const haveSentDate = !!user.emailConfirmationSentDate
    if (haveSentDate) {
      const now = moment()
      const sentDate = moment(user.emailConfirmationSentDate)
      const blockedDate = moment(user.emailConfirmationSentDate).add(7, 's') // 7 seconds
      const isWaiting = now.isBetween(sentDate, blockedDate)

      if (isWaiting) {
        throw new AppError(
          'Você deve aguardar alguns instantes para enviar um novo email de confirmação', // TODO: i18n
          new Error(),
          400
        )
      }
    }

    if (!request.locals.user) {
      request.locals.user = user
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao confirmar email do usuário', // TODO: i18n
      error,
      500
    )
  }
}

const validateUserRecoverPassSentDate = async (request, _, next) => {
  try {
    const {
      locals: { user }
    } = request

    const haveSentDate = !!user.recoverPassSentDate
    if (haveSentDate) {
      const now = moment()
      const sentDate = moment(user.recoverPassSentDate)
      const blockedDate = moment(user.recoverPassSentDate).add(7, 's') // 7 seconds
      const isWaiting = now.isBetween(sentDate, blockedDate)

      if (isWaiting) {
        throw new AppError(
          'Você deve aguardar alguns instantes para enviar um novo email de recuperação de senha', // TODO: i18n
          new Error(),
          400
        )
      }
    }

    if (!request.locals.user) {
      request.locals.user = user
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao solicitar para recuperar senha', // TODO: i18n
      error,
      500
    )
  }
}

const validateUserEmailConfirmationCodeExistence = async (request, _, next) => {
  try {
    const {
      body: { email, emailConfirmationCode }
    } = request

    const [user] = await fetchUsers({ email, emailConfirmationCode })
    if (!user) {
      throw new AppError(
        'Código nao encontrado', // TODO: i18n
        new Error(),
        404
      )
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao confirmar email do usuário', // TODO: i18n
      error,
      500
    )
  }
}

const validateRefreshTokenExistence = async (request, _, next) => {
  const {
    body: { refreshToken }
  } = request

  try {
    const [tokens] = await fetchTokens({ refreshToken })
    if (!tokens) {
      throw new AppError(
        'Tokens não encontrado', // TODO: i18n
        new Error(),
        404
      )
    }

    const now = moment()
    const expiresIn = moment(tokens.expiresIn)

    const isExpired = now.isAfter(expiresIn)
    if (isExpired) {
      throw new AppError(
        'Refresh Token expirado', // TODO: i18n
        new Error(),
        400
      )
    }

    request.locals.tokens = tokens

    if (!request.locals.user) {
      request.locals.user = await findByUserID(tokens.userID)
    }

    if (!request.locals.realm) {
      request.locals.realm = await findRealmByID(tokens.realmID)
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao atualizar token', // TODO: i18n
      error,
      500
    )
  }
}

const validateUserRecoverPassCodeExistence = async (request, _, next) => {
  const {
    body: { token }
  } = request

  try {
    const { email, code: recoverPassCode } = verifyToken(token)

    if (!recoverPassCode) {
      throw new AppError(
        'Token jwt mal formatado.', // TODO: i18n
        new Error(),
        401
      )
    }

    const [user] = await fetchUsers({ email, recoverPassCode })
    if (!user) {
      throw new AppError(
        'Código não encontrado', // TODO: i18n
        new Error(),
        404
      )
    }

    if (!request.locals.user) {
      request.locals.user = user
    }

    next()
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw new AppError(
        'Falha ao recuperar senha, o token está inválido', // TODO: i18n
        error,
        401
      )
    }

    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao recuperar senha', // TODO: i18n
      error,
      500
    )
  }
}

const validateUpdateProfileSchema = celebrate({
  [Segments.BODY]: Joi.object({
    password: Joi.string().min(6).max(60).optional(),
    firstName: Joi.string().min(2).max(30).trim().optional(),
    lastName: Joi.string().min(2).max(30).trim().optional()
  })
})

const validateConfirmedEmail = async (request, response, next) => {
  const { body: { email } } = request

  try {
    const user = await findUserByEmail(email)
    if (!user) {
      throw new AppError(
        'Email ou senha inválida.', // TODO: i18n
        new Error(),
        400
      )
    }

    // Email não confirmado, é feito o reenvio do email de confirmação
    if (!user.emailConfirmed) {
      const { sendDate, blockedDate } = await processResendEmailConfirmation(user)
      return response.status(200).json({ sendDate, blockedDate })
    }

    next()
  } catch (error) {
    console.log(error.message)
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha verificar se o email está validado', // TODO: i18n
      error,
      500
    )
  }
}

module.exports = {
  authenticate,
  validateCreateUserSchema,
  validateUserNotExistence,
  validateLoginSchema,
  validateRefreshTokensSchema,
  validateConfirmEmailSchema,
  validateUserExistenceByEmail,
  validateUserNotEmailConfirmed,
  validateUserEmailConfirmationCodeExistence,
  validateConfirmEmailResendSchema,
  validateUserEmailSentDate,
  validateRefreshTokenExistence,
  validadeRecoverPasswordRequestSchema,
  validadeRecoverPasswordSchema,
  validateUserRecoverPassSentDate,
  validateUserRecoverPassCodeExistence,
  validateUpdateProfileSchema,
  validateConfirmedEmail
}
