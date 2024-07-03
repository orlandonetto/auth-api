const { celebrate, Joi, Segments } = require('celebrate')
const AppError = require('../../errors/AppError')
const { findRealmByID } = require('./realms.dao')

const validateRealmExistence = async (request, _, next) => {
  const realmID = request.params.realmID || request.query.realmID || request.body.realmID

  try {
    const realm = await findRealmByID(realmID)

    if (!realm) {
      throw new AppError(
        'Realm nao encontrado.', // TODO: i18n
        new Error(),
        404
      )
    }

    request.locals.realm = realm

    next()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao buscar Realm',
      error,
      500
    )
  }
}

const validateFetchRealmsSchema = celebrate({
  [Segments.QUERY]: Joi.object({
    _id: Joi.string().allow('', null),
    name: Joi.string().allow('', null)
  })
})

module.exports = {
  validateRealmExistence,
  validateFetchRealmsSchema
}
