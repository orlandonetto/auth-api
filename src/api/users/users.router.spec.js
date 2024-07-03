const {
  seedDB,
  teardownDB,
  extractUserLoginData
} = require('../../../test/utils')
const request = require('supertest')
const app = require('../../app')
const { connect } = require('../../services/mongo')
const { fetchTokens } = require('../../api/tokens/tokens.dao')
const { generateToken } = require('../../helpers/token-helper')
const emailService = require('../../services/email')
const sinon = require('sinon')
const { mongo } = require('../../config')

beforeAll(async () => {
  await connect(mongo.host, mongo.mockDbName)
  await seedDB()
})

afterAll(async () => {
  await teardownDB()
})

describe('[POST] /users', () => {
  const endpoint = '/users'

  it('must return 201 Created when the request body is valid', async () => {
    const response = await request(app).post(endpoint).send({
      email: 'user1@email.com',
      password: '#Pass123',
      firstName: 'John',
      lastName: 'Doe'
    })

    expect(response.statusCode).toBe(201)
    expect(response.body).toHaveProperty('_id')
    expect(response.body).toHaveProperty('email', 'user1@email.com')
    expect(response.body).toHaveProperty('firstName', 'John')
    expect(response.body).toHaveProperty('lastName', 'Doe')
    expect(response.body).not.toHaveProperty('password')
  })

  it('must return 400 Bad Request when email is missing', async () => {
    const response = await request(app).post(endpoint).send({
      password: 'password',
      firstName: 'John',
      lastName: 'Doe'
    })
    expect(response.statusCode).toBe(400)
    expect(response.body).toHaveProperty('message')
    expect(response.body).toHaveProperty('details')
  })

  it('must return 400 Bad Request when email is invalid', async () => {
    const response = await request(app).post(endpoint).send({
      email: 'invalid',
      password: 'password',
      firstName: 'John',
      lastName: 'Doe'
    })
    expect(response.statusCode).toBe(400)
    expect(response.body).toHaveProperty('message')
    expect(response.body).toHaveProperty('details')
  })

  it('must return 400 Bad Request when email already exists', async () => {
    await request(app).post(endpoint).send({
      email: 'existing@email.com',
      password: 'validPassword123',
      firstName: 'Valid',
      lastName: 'User'
    })

    const response = await request(app).post(endpoint).send({
      email: 'existing@email.com',
      password: 'validPassword123',
      firstName: 'Valid',
      lastName: 'User'
    })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('message')
  })
})

describe('[PUT] /users/me', () => {
  const endpoint = '/users/me'

  it('must return 400 Bad request when request body is invalid', async () => {
    const { accessToken } = await extractUserLoginData()

    const response = await request(app)
      .put(endpoint)
      .set({ authorization: `Bearer ${accessToken}` })
      .send({ any_key: 'any_value' })

    expect(response.statusCode).toBe(400)
    expect(response.body).toHaveProperty('message')
  })

  it('must return 304 Not modified when request body is not diff of database user', async () => {
    const { accessToken } = await extractUserLoginData()

    const response = await request(app)
      .put(endpoint)
      .set({ authorization: `Bearer ${accessToken}` })
      .send({
        firstName: 'John'
      })

    expect(response.statusCode).toBe(304)
  })

  it('must return 200 Ok when update user with success', async () => {
    const { accessToken } = await extractUserLoginData()

    const payload = {
      firstName: 'Johnny',
      lastName: 'Deep'
    }

    const response = await request(app)
      .put(endpoint)
      .set({ authorization: `Bearer ${accessToken}` })
      .send(payload)

    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('firstName', payload.firstName)
    expect(response.body).toHaveProperty('lastName', payload.lastName)
  })
})

describe('[POST] /users/login', () => {
  const endpoint = '/users/login'
  const REALM_ID = '63dfb6ea5590d5ee6a70abc4'

  it('must return 200 OK when the request body is valid and credentials match', async () => {
    const response = await request(app).post(endpoint).send({
      email: 'john.doe@netto.dev',
      password: '#Pass123',
      realmID: REALM_ID
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('user')
    expect(response.body).toHaveProperty('accessToken')
    expect(response.body).toHaveProperty('refreshToken')

    const tokens = await fetchTokens({
      accessToken: response.body.accessToken,
      refreshToken: response.body.refreshToken,
      userID: response.body.user._id,
      realmID: REALM_ID
    })

    expect(tokens.length).toBe(1)
    expect(tokens[0].accessToken).toBe(response.body.accessToken)
    expect(tokens[0].refreshToken).toBe(response.body.refreshToken)
    expect(tokens[0].userID.toString()).toBe(response.body.user._id.toString())
  })

  it('must return 400 Bad Request when the request body schema is invalid', async () => {
    const response = await request(app).post(endpoint).send({
      email: 'invalid',
      password: '#Pass123',
      realmID: '63dfb6ea5590d5ee6a70abc4'
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toHaveProperty('message')
    expect(response.body).toHaveProperty('details')
  })

  it('must return 400 Bad Request when the credentials not match', async () => {
    const response = await request(app).post(endpoint).send({
      email: 'not_found@netto.dev',
      password: '#Pass123',
      realmID: '63dfb6ea5590d5ee6a70abc4'
    })

    expect(response.statusCode).toBe(400)
  })

  it('must return 404 Not found when Realm not found', async () => {
    const response = await request(app).post(endpoint).send({
      email: 'john.doe@netto.dev',
      password: '#Pass123',
      realmID: '63dfb6ea5590d5ee6a000000'
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('[POST] /users/logout', () => {
  const endpoint = '/users/logout'
  const REALM_ID = '63dfb6ea5590d5ee6a70abc4'

  it('must return 204 No Content when logout', async () => {
    const req = request(app)
    const endpointLogin = '/users/login'
    const responseLogin = await req.post(endpointLogin).send({
      email: 'john.doe@netto.dev',
      password: '#Pass123',
      realmID: REALM_ID
    })
    expect(responseLogin.statusCode).toBe(200)
    expect(responseLogin.body).toHaveProperty('accessToken')

    const { accessToken } = responseLogin.body

    const response = await req
      .post(endpoint)
      .set({ authorization: `Bearer ${accessToken}` })

    expect(response.statusCode).toBe(204)

    const endpointMe = '/users/me'
    const responseMe = await req
      .get(endpointMe)
      .set({ authorization: `Bearer ${accessToken}` })

    expect(responseMe.status).toBe(401)
    expect(responseMe.body).toHaveProperty('message')
  })

  it('must return 401 Bad request when try logout with invalid accessToken', async () => {
    const accessToken = 'invalid_token'

    const response = await request(app)
      .post(endpoint)
      .set({ authorization: `Bearer ${accessToken}` })

    expect(response.statusCode).toBe(401)
    expect(response.body).toHaveProperty('message')
  })
})

describe('[GET] /users/me', () => {
  const endpoint = '/users/me'
  const payloadToken = {
    _id: '63dfb6ef1bcdbd724f89fcf4',
    email: 'john.doe@netto.dev'
  }
  const INVALID_ID = '63dfb6ea5590d5ee6a000000'
  const EXPIRED_TOKEN = generateToken(payloadToken, null, -1000)
  const INVALID_SECRET_TOKEN = generateToken(payloadToken, 'not.shh')
  const INVALID_USER_TOKEN = generateToken({
    ...payloadToken,
    _id: INVALID_ID
  })

  it('must return 200 OK when the user is authenticated', async () => {
    const endpointLogin = '/users/login'
    const REALM_ID = '63dfb6ea5590d5ee6a70abc4'
    const responseLogin = await request(app).post(endpointLogin).send({
      email: 'john.doe@netto.dev',
      password: '#Pass123',
      realmID: REALM_ID
    })

    const { accessToken } = responseLogin.body

    const response = await request(app)
      .get(endpoint)
      .set({ authorization: `Bearer ${accessToken}` })

    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('_id', payloadToken._id)
    expect(response.body).toHaveProperty('email', payloadToken.email)
    expect(response.body).not.toHaveProperty('password')
  })

  it('must return 401 Not Authorized when jwt is malformed', async () => {
    const response = await request(app)
      .get(endpoint)
      .set({ authorization: `Bearer ${'malformed.token'}` })

    expect(response.statusCode).toBe(401)
  })

  it('must return 401 Not Authorized when jwt is expired', async () => {
    const response = await request(app)
      .get(endpoint)
      .set({ authorization: `Bearer ${EXPIRED_TOKEN}` })

    expect(response.statusCode).toBe(401)
  })

  it('must return 401 Not Authorized when jwt is invalid secret', async () => {
    const response = await request(app)
      .get(endpoint)
      .set({ authorization: `Bearer ${INVALID_SECRET_TOKEN}` })

    expect(response.statusCode).toBe(401)
  })

  it('must return 401 Not Authorized when jwt is valid, but the user is invalid', async () => {
    const response = await request(app)
      .get(endpoint)
      .set({ authorization: `Bearer ${INVALID_USER_TOKEN}` })

    expect(response.statusCode).toBe(401)
  })
})

describe('[POST] /users/confirm-email', () => {
  const endpoint = '/users/confirm-email'
  const EMAIL = 'jane.dae@netto.dev'
  const EMAIL_CONFIRMED = 'john.doe@netto.dev'
  const EMAIL_INVALID = 'invalid@netto.dev'
  const CODE = 'TCHOU'
  const CODE_INVALID = 'INVALID'
  const REALM_ID = '63dfb6ea5590d5ee6a70abc4'

  it('must return 400 when invalid confirmation schema', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({ email: null, emailConfirmationCode: null, realmID: REALM_ID })

    expect(response.statusCode).toBe(400)
  })

  it('must return 404 Not found when the email not found', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({ email: EMAIL_INVALID, emailConfirmationCode: CODE, realmID: REALM_ID })

    expect(response.statusCode).toBe(404)
  })

  it('must return 404 Not found when the code not found', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({ email: EMAIL, emailConfirmationCode: CODE_INVALID, realmID: REALM_ID })

    expect(response.statusCode).toBe(404)
  })

  it('must return 304 Not modified when the email already is confirmed', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({ email: EMAIL_CONFIRMED, emailConfirmationCode: CODE, realmID: REALM_ID })

    expect(response.statusCode).toBe(304)
  })

  it('must return 200 Not content when the email is confirmed', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail')
    const response = await request(app)
      .post(endpoint)
      .send({ email: EMAIL, emailConfirmationCode: CODE, realmID: REALM_ID })

    expect(response.statusCode).toBe(200)
    expect(spy).toHaveBeenCalled()
  })
})

describe('[POST] /users/confirm-email/resend', () => {
  const endpoint = '/users/confirm-email/resend'
  const EMAIL = 'tony.due@netto.dev'
  const EMAIL_CONFIRMED = 'john.doe@netto.dev'
  const EMAIL_INVALID = 'invalid@netto.dev'

  it('must return 400 when invalid confirmation schema', async () => {
    const response = await request(app).post(endpoint).send({ email: null })

    expect(response.statusCode).toBe(400)
  })

  it('must return 404 Not found when the email not found', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({ email: EMAIL_INVALID })

    expect(response.statusCode).toBe(404)
  })

  it('must return 304 Not modified when the email already is confirmed', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({ email: EMAIL_CONFIRMED })

    expect(response.statusCode).toBe(304)
  })

  it('must return 200 Ok when success resend', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail')
    spy.mockClear()

    const beforeResponse = await request(app)
      .post(endpoint)
      .send({ email: EMAIL })

    expect(beforeResponse.statusCode).toBe(200)
    expect(spy).toHaveBeenCalledTimes(1)

    const response = await request(app).post(endpoint).send({ email: EMAIL })

    expect(response.statusCode).toBe(400)
    expect(response.body).toHaveProperty('message')
    expect(spy).toHaveBeenCalledTimes(1)

    const clock = sinon.useFakeTimers()
    clock.tick(30000)

    const responseAfter = await request(app)
      .post(endpoint)
      .send({ email: EMAIL })

    expect(responseAfter.statusCode).toBe(200)
    expect(spy).toHaveBeenCalledTimes(2)

    clock.restore()
  })
})

describe('[POST] /users/refresh-tokens', () => {
  const endpoint = '/users/refresh-tokens'
  const USER_ID = '63dfb6ef1bcdbd724f89fcf4'
  const REALM_ID = '63dfb6ea5590d5ee6a70abc4'
  const REFRESH_TOKEN_INVALID = 'invalid_token'
  const REFRESH_TOKEN_EXPIRED = '01d5fca49219429f8abc2ac6cb34e907'

  it('must return 400 when refresh token request body is invalid', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({ refreshToken: null })

    expect(response.statusCode).toBe(400)
    expect(response.body).toHaveProperty('message')
  })

  it('must return 404 when refresh token not found', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({ refreshToken: REFRESH_TOKEN_INVALID })

    expect(response.statusCode).toBe(404)
    expect(response.body).toHaveProperty('message')
  })

  it('must return 400 when refresh token is expired', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({ refreshToken: REFRESH_TOKEN_EXPIRED })

    expect(response.statusCode).toBe(400)
    expect(response.body).toHaveProperty('message')
  })

  it('must return 200 when tokens was refreshed', async () => {
    const { refreshToken } = await extractUserLoginData(USER_ID, REALM_ID)

    const response = await request(app).post(endpoint).send({ refreshToken })

    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('accessToken')
    expect(response.body).toHaveProperty('refreshToken')

    const afterResponse = await request(app)
      .post(endpoint)
      .send({ refreshToken })

    expect(afterResponse.statusCode).toBe(404)
    expect(afterResponse.body).toHaveProperty('message')
  })
})

describe('[POST] /users/recover-pass/request', () => {
  const endpoint = '/users/recover-pass/request'
  const EMAIL = 'tony.due@netto.dev'
  const EMAIL_INVALID = 'invalid@netto.dev'

  it('must return 400 when invalid recover pass request schema', async () => {
    const response = await request(app).post(endpoint).send({ email: null })

    expect(response.statusCode).toBe(400)
  })

  it('must return 404 Not found when the email not found', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({ email: EMAIL_INVALID })

    expect(response.statusCode).toBe(404)
  })

  it('must return 200 Ok when success recover pass request', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail')
    spy.mockClear()

    const response = await request(app).post(endpoint).send({ email: EMAIL })

    expect(response.statusCode).toBe(204)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('must return 400 Bad request when recover pass sent date is awaiting', async () => {
    const spy = jest.spyOn(emailService, 'sendEmail')
    spy.mockClear()

    const clock = sinon.useFakeTimers()
    clock.tick(30000)

    const response1 = await request(app).post(endpoint).send({ email: EMAIL })

    expect(response1.statusCode).toBe(204)
    expect(spy).toHaveBeenCalledTimes(1)

    clock.tick(1000)

    const response2 = await request(app).post(endpoint).send({ email: EMAIL })

    expect(response2.statusCode).toBe(400)
    expect(response2.body).toHaveProperty('message')
    expect(spy).toHaveBeenCalledTimes(1)

    clock.restore()
  })
})

describe('[POST] /users/recover-pass', () => {
  const endpoint = '/users/recover-pass'
  const CODE = 'DALE'
  const CODE_NOT_FOUND = 'NOTFOUND'
  const EMAIL = 'jane.dae@netto.dev'
  const PASSWORD_OLD = '#Pass123'
  const PASSWORD_NEW = '#Test123'
  const REALM_ID = '63dfb6ea5590d5ee6a70abc4'

  const TOKEN = generateToken({
    email: EMAIL,
    code: CODE
  })
  const TOKEN_INVALID_CODE = generateToken({
    email: EMAIL,
    code: null
  })
  const TOKEN_NOT_FOUND_CODE = generateToken({
    email: EMAIL,
    code: CODE_NOT_FOUND
  })

  it('must return 400 Bad request when recover pass schema is invalid', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({ token: null, password: null })

    expect(response.statusCode).toBe(400)
    expect(response.body).toHaveProperty('message')
  })

  it('must return 401 Not authorized when jwt payload have a invalid code', async () => {
    const response = await request(app).post(endpoint).send({
      token: TOKEN_INVALID_CODE,
      password: PASSWORD_NEW
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toHaveProperty('message')
  })

  it('must return 404 Not found when recover pass code not found', async () => {
    const response = await request(app).post(endpoint).send({
      token: TOKEN_NOT_FOUND_CODE,
      password: PASSWORD_NEW
    })

    expect(response.statusCode).toBe(404)
    expect(response.body).toHaveProperty('message')
  })

  it('must return 204 Not content when recovered password with success', async () => {
    const response = await request(app).post(endpoint).send({
      token: TOKEN,
      password: PASSWORD_NEW
    })

    expect(response.statusCode).toBe(204)

    const responseLoginOldPass = await request(app)
      .post('/users/login')
      .send({ email: EMAIL, password: PASSWORD_OLD, realmID: REALM_ID })
    expect(responseLoginOldPass.statusCode).toBe(400)

    const responseLoginNewPass = await request(app)
      .post('/users/login')
      .send({ email: EMAIL, password: PASSWORD_NEW, realmID: REALM_ID })
    expect(responseLoginNewPass.statusCode).toBe(200)
  })
})
