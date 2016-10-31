const crypto = require('crypto')
const bitcore = require('bitcore-lib')

const { Base58 } = bitcore.encoding

const HID_LENGTH = 22

const Hid = val => {
  const charRange = Base58.validCharacters(val)
  const charLength = val.length === HID_LENGTH

  if (charRange && charLength) {
    return val
  }

  return Base58.encode(crypto
    .createHash('sha256').update(val)
    .digest().slice(0, 16))
}

module.exports = Hid
