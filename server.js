const { port } = require('./src/config')

// Initialize mailer transporter
require('./src/services/email')

const app = require('./src/app')
const { connect } = require('./src/services/mongo')
const { mongo } = require('./src/config')

setImmediate(async () => {
  // conectar o banco de dados
  await connect(mongo.host, mongo.dbName, mongo.options)
})

// Verifica se o arquivo está sendo executado diretamente e não como um módulo importado
if (require.main === module) {
  app.listen(port, () => console.log(`Server started on port ${port}`))
}

exports['auth-api'] = app
