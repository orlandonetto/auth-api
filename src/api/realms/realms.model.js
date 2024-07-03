const { model, Schema } = require('mongoose')

const schema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  redirectURL: {
    type: String,
    required: true
  },
  backgroundURL: {
    type: String,
    default: null
  }
}, { timestamps: true, versionKey: false })

module.exports = model('realms', schema)
