const containsAlphabeticalChar = (str) => {
  str = (str || '').toString()
  return /[a-zA-Z]+/.test(str)
}

const separateNumbersAndLetters = (str) => {
  str = (str || '').toString()
  const numbers = str.split('').filter((char) => !isNaN(char))
  const letters = str.split('').filter((char) => isNaN(char))
  return { numbers: numbers.join(''), letters: letters.join('') }
}

const generateRandomString = (
  length = 5,
  characters = 'ACEFGHJKQRSTUVWXYZ245789'
) => {
  let result = ''

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

const capitalize = (text = '') => {
  return text.charAt(0).toUpperCase().concat(text.toLowerCase().substring(1))
}

module.exports = {
  containsAlphabeticalChar,
  separateNumbersAndLetters,
  generateRandomString,
  capitalize
}
