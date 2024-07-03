const { isNotNull, isDefined } = require('../../helpers/object-helper')
const { encryptPassword } = require('../../helpers/password-helper')
const Users = require('./users.model')

const createUser = async (payload) => {
  const createdUser = await Users.create({ ...payload })

  return findByUserID(createdUser._id)
}

const findByUserID = async (_id) => {
  return Users.findById(_id)
}

const existsByEmailConfirmationCode = async (emailConfirmationCode) => {
  return Users.exists({ emailConfirmationCode })
}

const existsByRecoverPassCode = async (recoverPassCode) => {
  return Users.exists({ recoverPassCode })
}

const findUserByEmail = async (email) => {
  return Users.findOne({ email })
}

const fetchPasswordByEmail = async (email) => {
  return Users.findOne({ email }, { email: 1, password: 1 })
}

const fetchUsers = async (params) => {
  const query = {
    ...(isNotNull(params.email) && { email: params.email }),
    ...(isNotNull(params.emailConfirmationCode) && {
      emailConfirmationCode: params.emailConfirmationCode
    }),
    ...(isNotNull(params.recoverPassCode) && {
      recoverPassCode: params.recoverPassCode
    })
  }

  return Users.find(query)
}

const updateUser = async (userID, params) => {
  const $set = {
    ...(isNotNull(params.firstName) && { firstName: params.firstName }),
    ...(isNotNull(params.lastName) && { lastName: params.lastName }),
    ...(isNotNull(params.password) && {
      password: await encryptPassword(params.password)
    }),
    ...(isDefined(params.emailConfirmationCode) && {
      emailConfirmationCode: params.emailConfirmationCode
    }),
    ...(isDefined(params.emailConfirmationSentDate) && {
      emailConfirmationSentDate: params.emailConfirmationSentDate
    }),
    ...(isNotNull(params.emailConfirmed) && {
      emailConfirmed: params.emailConfirmed,
      emailConfirmationCode: null,
      emailConfirmationSentDate: null
    }),
    ...(isDefined(params.recoverPassCode) && {
      recoverPassCode: params.recoverPassCode
    }),
    ...(isDefined(params.recoverPassSentDate) && {
      recoverPassSentDate: params.recoverPassSentDate
    })
  }

  return Users.updateOne({ _id: userID }, { $set })
}

module.exports = {
  createUser,
  findByUserID,
  findUserByEmail,
  fetchPasswordByEmail,
  existsByEmailConfirmationCode,
  existsByRecoverPassCode,
  fetchUsers,
  updateUser
}
