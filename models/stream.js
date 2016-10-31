const Hid = require('./hid')
const Integer = require('./integer')

class Stream {
  constructor ({ id, name, listeners, bph, url, info }) {
    this.id = Hid(id)
    this.name = name
    this.listeners = Integer(listeners) || 0
    this.bph = Integer(bph) || 1
    this.url = url
    this.info = info
  }

  toJSON () {
    return Object.assign(this, { url: undefined })
  }

  getUrl () {
    return `/stream/${this.id}`
  }
}

module.exports = Stream
