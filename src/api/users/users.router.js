const { Router } = require('express')
const { validateRealmExistence } = require('../realms/realms.middleware')
const router = Router()

const {
  createUser,
  login,
  getMe,
  logout,
  confirmEmail,
  confirmEmailResend,
  refreshTokens,
  recoverPasswordRequest,
  recoverPassword,
  updateProfile
} = require('./users.controller')
const {
  validateCreateUserSchema,
  validateUserNotExistence,
  validateLoginSchema,
  authenticate,
  validateConfirmEmailSchema,
  validateUserExistenceByEmail,
  validateUserEmailConfirmationCodeExistence,
  validateUserNotEmailConfirmed,
  validateConfirmEmailResendSchema,
  validateUserEmailSentDate,
  validateRefreshTokensSchema,
  validateRefreshTokenExistence,
  validadeRecoverPasswordSchema,
  validateUserRecoverPassSentDate,
  validadeRecoverPasswordRequestSchema,
  validateUserRecoverPassCodeExistence,
  validateUpdateProfileSchema, validateConfirmedEmail
} = require('./users.middleware')

router.post(
  '/',
  validateCreateUserSchema,
  validateUserNotExistence,
  createUser
)
router.post('/login', validateLoginSchema, validateRealmExistence, validateConfirmedEmail, login)
router.post('/logout', authenticate, logout)
router.post(
  '/refresh-tokens',
  validateRefreshTokensSchema,
  validateRefreshTokenExistence,
  refreshTokens
)
router.get('/me', authenticate, getMe)
router.post(
  '/confirm-email',
  validateConfirmEmailSchema,
  validateRealmExistence,
  validateUserExistenceByEmail,
  validateUserNotEmailConfirmed,
  validateUserEmailConfirmationCodeExistence,
  confirmEmail
)
router.post(
  '/confirm-email/resend',
  validateConfirmEmailResendSchema,
  validateUserNotEmailConfirmed,
  validateUserEmailSentDate,
  confirmEmailResend
)
router.post(
  '/recover-pass/request',
  validadeRecoverPasswordRequestSchema,
  validateUserExistenceByEmail,
  validateUserRecoverPassSentDate,
  recoverPasswordRequest
)
router.post(
  '/recover-pass',
  validadeRecoverPasswordSchema,
  validateUserRecoverPassCodeExistence,
  recoverPassword
)
router.put('/me', authenticate, validateUpdateProfileSchema, updateProfile)

module.exports = router
