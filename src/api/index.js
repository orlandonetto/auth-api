const { Router } = require('express')

const router = Router()

const usersRouter = require('./users/users.router')
const realmsRouter = require('./realms/realms.router')

router.use('/users', usersRouter)
router.use('/realms', realmsRouter)

module.exports = router
