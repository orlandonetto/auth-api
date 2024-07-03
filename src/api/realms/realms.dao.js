const Realms = require('./realms.model')

const findRealmByID = async (realmID) => {
  return Realms.findById(realmID)
}

const findRealmByName = async (name) => {
  return Realms.findOne({ name })
}

const fetchRealms = async ({ _id, name }) => {
  const query = {
    ...(!!_id && { _id }),
    ...(!!name && { name })
  }

  return Realms.find(query)
}

module.exports = {
  findRealmByID,
  findRealmByName,
  fetchRealms
}
