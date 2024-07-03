const { Schema, model } = require('mongoose')

const schema = new Schema({
  accessToken: {
    type: String,
    unique: true,
    required: true
  },
  refreshToken: {
    type: String,
    unique: true,
    required: true
  },
  userID: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Users'
  },
  realmID: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Realms'
  },
  expiresIn: {
    type: Date,
    required: true
  }
}, { timestamps: true, versionKey: false })

module.exports = model('tokens', schema)
