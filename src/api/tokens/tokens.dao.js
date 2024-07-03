const Token = require('./tokens.model')

const createToken = async (payload) => {
  return Token.create(payload)
}

const fetchTokens = async (params) => {
  return Token.find({
    ...(!!params._id && { _id: params._id }),
    ...(!!params.accessToken && { accessToken: params.accessToken }),
    ...(!!params.refreshToken && { refreshToken: params.refreshToken }),
    ...(!!params.userID && { userID: params.userID }),
    ...(!!params.realmID && { realmID: params.realmID })
  })
}

const findByAccessToken = async (accessToken) => {
  return Token.findOne({ accessToken })
}

const removeTokenByUserID = async ({ userID, realmID }) => {
  const query = {
    userID,
    ...(!!realmID && { realmID })
  }

  return Token.deleteMany(query)
}

const removeToken = async (accessToken) => {
  return Token.deleteOne({ accessToken })
}

module.exports = {
  createToken,
  fetchTokens,
  findByAccessToken,
  removeTokenByUserID,
  removeToken
}
