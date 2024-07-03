const nodemailer = require('nodemailer')
const { email: { host, port, user, pass } } = require('../../config')

console.log(`mailer transporter is initiated with user [${user}]`)
const transporter = nodemailer.createTransport({
  host,
  port,
  secure: true,
  auth: { user, pass }
})

const sendEmail = async (to, subject, html) => {
  const info = await transporter.sendMail({
    from: user,
    to,
    subject,
    html
  })

  console.log(`Message sent: ${info.messageId}`)
}

module.exports = {
  sendEmail
}
