const bitcore = require('bitcore-lib')
const { error } = require('../responses')

const Address = val => {
  const { Address } = bitcore

  if (Address.isValid(val)) {
    return val
  }
}

Address.address = (req, res, next) => {
  const { addr } = req.params
  const address = Address(addr)

  if (!address) {
    req.body = new Error('wrong address')
    error(req, res, next)
    return
  }

  req.body = address
  next()
}

module.exports = Address
