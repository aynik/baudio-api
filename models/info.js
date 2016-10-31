const { title } = require('../parsers')

class Info {
  constructor (data) {
    let parsed
    try {
      parsed = title.parse(data)
    } catch (err) {
      parsed = { title: '<Unknown>' }
    }
    this.value = parsed.artist ?
      `${parsed.artist} - ${parsed.title}` :
      parsed.title
  }

  toJSON () {
    return { info: this.value }
  }
}

module.exports = Info
