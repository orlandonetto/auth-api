const isNull = (object) => {
  return [null, undefined].includes(object)
}

const isNotNull = (object) => !isNull(object)

const isUndefined = (object) => [undefined].includes(object)

const isDefined = (object) => !isUndefined(object)

const getKeysDiff = (target, source) => {
  return Object.keys(source).filter((key) => source[key] !== target[key])
}

module.exports = {
  isNull,
  isNotNull,
  isUndefined,
  isDefined,
  getKeysDiff
}
