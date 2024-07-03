const { Router } = require('express')
const { validateFetchRealmsSchema, validateRealmExistence } = require('./realms.middleware')
const { findRealms, findByRealmID } = require('./realms.controller')

const router = Router()

router.get('/', validateFetchRealmsSchema, findRealms)
router.get('/:realmID', validateRealmExistence, findByRealmID)

module.exports = router
