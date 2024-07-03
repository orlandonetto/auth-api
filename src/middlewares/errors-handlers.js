const AppError = require('../errors/AppError')
const { isCelebrateError } = require('celebrate')
const { JsonWebTokenError } = require('jsonwebtoken')

const exceptionHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message })
  }

  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({ message: err.message })
  }

  if (isCelebrateError(err)) {
    const details = Array.from(err.details.entries()).map(([segment, joiError]) => ({
      source: segment,
      keys: joiError.details,
      message: joiError.message
    }))

    return res.status(400).json({
      message: 'Falha na validação dos campos', // TODO: i18n
      details
    })
  }

  // Caso ocorra algum erro inesperado, retornar um erro 500
  return res.status(500).json({ message: 'Erro interno do servidor' }) // TODO: i18n
}

module.exports = {
  exceptionHandler
}
