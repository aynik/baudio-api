const { PassThrough } = require('stream')

class Buffered extends PassThrough {
  constructor (maxSize) {
    super()
    this.maxSize = maxSize
    this.size = 0
    this.cache = []
  }

  pipe (dest, opts) {
    this.cache.forEach(packet => dest.write(packet))
    this.on('data', data => dest.write(data))
    if (!opts || opts.end) {
      this.on('end', dest.destroy.bind(dest))
    }
    this.emit('piped')
    return dest
  }

  write (chunk, encoding, cb) {
    this.cache.push(chunk)
    this.size += chunk.length
    if (this.size > this.maxSize) {
      this.size -= this.cache.shift().length
    }
    return super.write(chunk, encoding, cb)
  }
}

module.exports = Buffered
