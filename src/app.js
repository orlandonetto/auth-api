require('express-async-errors')

const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const bodyParser = require('body-parser')

const routes = require('./api')
const { exceptionHandler } = require('./middlewares/errors-handlers')

const app = express()

// Use CORS
app.use(cors({
  origin: '*',
  exposedHeaders: []
}))

// Use Morgan
app.use(morgan('dev'))

// Use Body-Parser
app.use(bodyParser.json())

// Initiate Request Locals Object
app.use((request, _, next) => {
  request.locals = {}

  next()
})

// Routes
app.use(routes)

// Exception Handler
app.use(exceptionHandler)

module.exports = app
