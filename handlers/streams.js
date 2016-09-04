const crypto = require('crypto')
const { PassThrough } = require('stream')

const parse = require('co-body')
const request = require('request')
const icy = require('icy')
const lru = require('lru-cache')

const { Hash, Integer, Stream } = require('../models')

const serviceUrl = process.env.NOW_ALIAS || process.env.NOW_URL

const cache = lru({
  max: 1000,
  dispose (_, stream) {
    stream.unpipe()
  }
})

const bindFinish = (ctx, stream) => (
  ctx.res.on('finish', _ => stream.removeListener('error', ctx.onerror))
)

const makeStream = (url, hid) => (
  request(url).pipe(PassThrough()).on('finish', _ => cache.del(hid))
)

const list = redis => function * () {
  this.body = yield redis.keys('stream:*')
    .then(keys => keys.map(key => key.split(':')[1]))
}

const scan = redis => function * (c, n) {
  this.body = yield redis.scan(Integer(n) || 0, 'MATCH', 'stream:*', 'COUNT', Integer(c))
    .then(([c, keys]) =>
      Promise.all(keys.map(key => redis.hgetall(key).then(Stream)))
        .then(value => [Integer(c), value]))
}

const register = redis => function * () {
  const body = yield parse(this, { limit: '1kb' })
  if (!body.url) this.throw(400, 'received body without url')
  const hid = crypto.createHash('sha256').update(body.url).digest('hex')
  icy.get(body.url, res => {
    const name = res.headers['icy-name'] || hid
    const stream = Stream.Private({ id: hid, name, url: body.url })
    redis.hmset(`stream:${hid}`, stream)
  })
  this.status = 302
  this.set('Location', `${serviceUrl}/stream/${hid}`)
}

const one = redis => function * (id) {
  const type = this.accepts('*/*', 'json')
  if (type === false) this.throw(406)
  const hid = Hash(id)
  if (!hid) this.throw(400, 'wrong id')
  if (type === 'json') {
    this.body = yield redis.hgetall(`stream:${hid}`).then(Stream)
  } else {
    let stream = cache.get(hid)
    if (!stream) {
      const url = yield redis.hget(`stream:${hid}`, 'url')
      stream = makeStream(url, hid)
      cache.set(hid, stream)
    }
    bindFinish(this, stream)
    this.body = stream
  }
}

module.exports = {
  list,
  scan,
  one,
  register
}
