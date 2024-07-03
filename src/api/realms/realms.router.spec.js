const request = require('supertest')

const { seedDB, teardownDB } = require('../../../test/utils')
const { connect } = require('../../services/mongo')
const app = require('../../app')
const { mongo } = require('../../config')

beforeAll(async () => {
  await connect(mongo.host, mongo.mockDbName)
  await seedDB()
})

afterAll(async () => {
  await teardownDB()
})

describe('[GET] /realms', () => {
  const endpoint = '/realms'

  it('must return 200 Ok when the request query is valid', async () => {
    const response = await request(app).get(endpoint).query({})

    expect(response.statusCode).toBe(200)
    expect(response.body.length).toBeGreaterThan(0)
    expect(response.body[0]).toHaveProperty('_id')
    expect(response.body[0]).toHaveProperty('name')
    expect(response.body[0]).toHaveProperty('redirectURL')
    expect(response.body[0]).toHaveProperty('backgroundURL')
  })

  it('must return 200 Ok when is empty response', async () => {
    const response = await request(app)
      .get(endpoint)
      .query({ name: 'invalid_tchou' })

    expect(response.statusCode).toBe(200)
    expect(response.body.length).toBe(0)
  })
})

describe('[GET] /realms/:realmID', () => {
  const realmID = '63dfb6ea5590d5ee6a70abc4'
  const endpoint = `/realms/${realmID}`
  const INVALID_ID = '000000ea5590d5ee6a700000'

  it('must return 200 Ok when the request contains a valid realmID', async () => {
    const response = await request(app).get(endpoint)

    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('_id')
    expect(response.body).toHaveProperty('name')
    expect(response.body).toHaveProperty('redirectURL')
    expect(response.body).toHaveProperty('backgroundURL')
  })

  it('must return 404 Not found when the request contains a invalid realmID', async () => {
    const response = await request(app).get(`/realms/${INVALID_ID}`)

    expect(response.statusCode).toBe(404)
    expect(response.body).toHaveProperty('message')
  })
})
