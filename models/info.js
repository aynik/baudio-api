const { title } = require('../parsers')

class Info {
  constructor (data) {
    const parsed = title.parse(data)
    this.value = parsed.artist ?
      `${parsed.artist} - ${parsed.title}` :
      parsed.title
  }

  toJSON () {
    return { info: this.value }
  }
}

module.exports = Info
