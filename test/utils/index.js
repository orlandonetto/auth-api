const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const { encryptPassword } = require('../../src/helpers/password-helper')
const {
  generateToken,
  generateRefreshToken
} = require('../../src/helpers/token-helper')
const { createToken } = require('../../src/api/tokens/tokens.dao')
const { generateExpiresIn } = require('../../src/api/tokens/tokens.helper')
const { findByUserID } = require('../../src/api/users/users.dao')

const teardownDB = async () => {
  await mongoose.connection.db.dropDatabase()
  await mongoose.connection.close(true)
}

const seedDB = async () => {
  const mockPath = path.join(__dirname, '/../seeders')
  const models = {} // Armazena todos os modelos do Mongoose

  // Lê todos os arquivos dentro da pasta de seeders
  const files = fs.readdirSync(mockPath)

  for await (const file of files) {
    // Ignora arquivos que não são JSON
    if (!file.endsWith('.json')) return

    // Lê o conteúdo do arquivo JSON
    const mockData = JSON.parse(fs.readFileSync(path.join(mockPath, file)))
    const collectionName = file.slice(0, -5) // remove .json from filename

    // Verifica se o modelo já foi criado
    if (!models[collectionName]) {
      try {
        models[collectionName] = mongoose.model(collectionName)

        const data = await mapMockToModelData(mockData)

        // Insere os dados no banco de dados
        await models[collectionName].insertMany(data)
      } catch (err) {
        console.log(err)
      }
    }
  }
}

const mapMockToModelData = async (mockData = []) => {
  const modelData = []

  for await (const mock of mockData) {
    modelData.push({
      ...mock,
      ...(!!mock.password && {
        password: await encryptPassword(mock.password)
      })
    })
  }

  return modelData
}

const extractUserLoginData = async (
  userID = '63dfb6ef1bcdbd724f89fcf4',
  realmID = '63dfb6ea5590d5ee6a70abc4'
) => {
  const user = await findByUserID(userID)

  const accessToken = generateToken({ userID, email: user.email })
  const refreshToken = generateRefreshToken()

  await createToken({
    userID,
    realmID,
    accessToken,
    refreshToken,
    expiresIn: generateExpiresIn()
  })

  return {
    accessToken,
    refreshToken,
    user
  }
}

module.exports = {
  seedDB,
  teardownDB,
  extractUserLoginData
}
