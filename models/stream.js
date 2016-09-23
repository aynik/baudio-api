const Hash = require('./hash')
const Integer = require('./integer')

class Stream {
  constructor ({ id, name, listeners, bph, url, info }) {
    this.id = Hash(id)
    this.name = name
    this.listeners = Integer(listeners) || 0
    this.bph = Integer(bph) || 1
    this.url = url
    this.info = info
  }

  toJSON () {
    return Object.assign(this, { url: undefined })
  }
}

module.exports = Stream
