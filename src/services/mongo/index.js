const mongoose = require('mongoose')
const config = require('../../config')

// Quando strict está ativado, exige que ao salvar os dados, eles estejam de acordo com o schema definido, ou será rejeitado
mongoose.set('strictQuery', false)

const connect = async (host = config.mongo.host, dbName = config.mongo.dbName, options = config.mongo.options) => {
  try {
    const uri = `${host}/${dbName}`

    console.log('MongoDB connecting...')
    await mongoose.connect(uri, options)
    console.log(`MongoDB connected to ${dbName} on ${host}`)
  } catch (error) {
    console.log('Mongoose error: ', error)
  }
}

module.exports = { connect }
