const crypto = require('crypto')
const icy = require('icy')

const { Hash, Info, Integer, Stream } = require('../models')
const { Buffered } = require('../transforms')
const { error, json, mp3, redirect } = require('./responses')
const { store } = require('./store')

const serviceUrl = process.env.NOW_ALIAS || process.env.NOW_URL

const key = hid => `stream:${hid}`

const list = (req, res, next) => {
  const { redis } = req
  req.body = redis.keys(key('*'))
    .then(keys => keys.map(key => key.split(':')[1]))
  next()
}

const scan = (req, res, next) => {
  const { c, n } = req.params
  const { redis } = req
  req.body = redis.scan(Integer(n) || 0, 'MATCH', key('*'), 'COUNT', Integer(c))
    .then(([c, keys]) =>
      Promise.all(keys.map(key => redis.hgetall(key)
        .then(stream => new Stream(stream))))
        .then(value => [Integer(c), value]))
  next()
}

const one = (req, res, next) => {
  const { id } = req.params
  const hid = Hash(id)
  if (!hid) {
    req.statusCode = 404
    req.body = new Error('not found')
    return error(req, res, next)
  }
  const { redis } = req
  req.body = redis.hgetall(key(hid))
    .then(record => new Stream(record))
  next()
}

const register = (req, res, next) => {
  if (!req.body.url) {
    req.statusCode = 404
    req.body = new Error('not url')
    return error(req, res, next)
  }

  const { redis } = req
  const hid = crypto.createHash('sha256')
    .update(req.body.url).digest('hex')

  icy.get(req.body.url, res => {
    const name = res.headers['icy-name'] || hid
    const stream = new Stream({
      id: hid,
      name,
      bph: req.body.bph || 1,
      url: req.body.url
    })
    redis.hmset(key(hid), stream)
    res.on('metadata', buf => {
      const info = new Info(icy.parse(buf).StreamTitle)
      redis.hset(key(hid), 'info', info.value)
      req.body = `${serviceUrl}/stream/${hid}`
      next()
    })
  })
}

const fetch = (req, res, next) => {
  if (req.body && req.body.pipe) return next()
  else if (!req.body) {
    req.body = new Error('no stream')
    return error(req, res, next)
  }
  const { redis } = req
  const { id, url } = req.body
  const buffered = new Buffered(160000) // 10s @ 128kbps
  icy.get(url, res => {
    res.on('data', data => buffered.write(data))
      .on('end', _ => store.del(key(id)))
      .on('metadata', buf => {
        const info = new Info(icy.parse(buf).StreamTitle)
        buffered.emit('info', info)
        redis.hset(key(id), 'info', info.value)
      })
    req.body = buffered
    next()
  }).on('error', err => {
    req.body = err
    error(req, res, next)
  })
}

const changes = (req, res, next) => {
  req.body.once('info', data => {
    req.body = data
    next()
  })
}

module.exports = {
  list,
  scan,
  one,
  register,
  fetch,
  changes,
  json,
  mp3,
  redirect
}
