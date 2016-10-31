const bitcore = require('bitcore-lib')
const { error } = require('./responses')

const { Address } = bitcore

const one = (req, res, next) => {
  const { addr } = req.params

  let address
  try {
    address = Address.fromString(addr)
  } catch (err) {
    req.body = new Error('wrong address')
    error(req, res, next)
    return
  }

  req.params = { key: addr, addr }
  req.body = address.toString()
  next()
}

module.exports = {
  one
}
