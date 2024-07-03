require('dotenv').config()

module.exports = {
  env: process.env.ENV || 'development',
  port: process.env.PORT || '8181',
  client: {
    baseURL: process.env.CLIENT_BASE_URL || 'http://localhost:8080/#'
  },
  server: {
    baseURL: process.env.SERVER_BASE_URL || 'http://localhost:7000'
  },
  mongo: {
    host: process.env.MONGO_HOST || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB_NAME || 'nettodev-auth',
    mockDbName: process.env.MONGO_DB_NAME_MOCK || 'nettodev-auth-test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'shhh',
    expiration: process.env.JWT_EXPIRATION || '2h',
    expirationRefresh: process.env.JWT_EXPIRATION_REFRESH || '3M' // (3M = 3 months)
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    user: process.env.SMTP_USER || 'orlandonetto.dev@gmail.com',
    pass: process.env.SMTP_PASS || 'vezfbdldlzqolong'
  }
}
