module.exports = () => {
  jest.mock('../../src/services/email', () => ({
    sendEmail: jest.fn(() => {
      console.log('sendEmail mocked...')
    })
  }))
}
