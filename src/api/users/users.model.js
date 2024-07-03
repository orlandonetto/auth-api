const { Schema, model } = require('mongoose')
const { encryptPassword } = require('../../helpers/password-helper')

const schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  emailConfirmed: {
    type: Boolean,
    default: false
  },
  emailConfirmationCode: {
    type: String,
    select: false,
    uppercase: true,
    default: null
  },
  emailConfirmationSentDate: {
    type: Date,
    default: null
  },
  recoverPassCode: {
    type: String,
    select: false,
    uppercase: true,
    default: null
  },
  recoverPassSentDate: {
    type: Date,
    default: null
  }
}, { timestamps: true, versionKey: false })

schema.index({ email: 1 })

schema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }

  this.password = await encryptPassword(this.password)

  next()
})

module.exports = model('users', schema)
