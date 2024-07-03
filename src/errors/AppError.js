class AppError extends Error {
  constructor (message, error, statusCode = 400) {
    super(message)

    this.statusCode = statusCode
    this.message = message
    this.error = error
  }
}

module.exports = AppError
