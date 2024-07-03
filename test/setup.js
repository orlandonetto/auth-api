require('../src/config')
const stubs = require('./stubs')

console.log('setting stubs...')
stubs()

jest.setTimeout(30000)
