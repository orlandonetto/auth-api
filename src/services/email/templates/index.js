const fs = require('fs')
const path = require('path')

// Diretório que contem todos os templates de emails
const templatePath = path.join(__dirname, '/../templates')
const templates = {} // Armazena todos os templates de Emails

// Lê todos os arquivos dentro da pasta templates
const files = fs.readdirSync(templatePath)

files.forEach(file => {
  // Ignora arquivos que não são .html
  if (!file.endsWith('.html')) return

  // Lê o conteúdo do arquivo HTML
  const template = fs.readFileSync(path.join(templatePath, file), 'utf-8')
  const templateName = file.slice(0, -5) // remove .html from filename

  if (templates[templateName]) return

  templates[templateName] = template
})

module.exports = templates
