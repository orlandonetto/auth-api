const AppError = require('../../errors/AppError')
const { fetchRealms } = require('./realms.dao')

const findRealms = async (request, response) => {
  try {
    const { query: payload } = request

    const realms = await fetchRealms(payload)

    return response.status(200).json(realms)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao buscar realms', // TODO: i18n
      error,
      500
    )
  }
}

const findByRealmID = async (request, response) => {
  try {
    const { locals: { realm } } = request

    return response.status(200).json(realm)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError(
      'Falha ao buscar realms', // TODO: i18n
      error,
      500
    )
  }
}

module.exports = {
  findRealms,
  findByRealmID
}
