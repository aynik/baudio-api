const icy = require('icy')

const { Hid, Info, Integer, Stream } = require('../models')
const { Buffered } = require('../transforms')
const { pullStream, pauseStream, unsetStream, updateStreams } = require('../actions')
const { error, json, mp3, redirect } = require('./responses')
const { stores } = require('./store')

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
  let hid
  try {
    hid = Hid(req.params.hid)
  } catch (err) {
    req.body = new Error('wrong hid')
    error(req, res, next)
    return
  }
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
  const { url } = req.body
  if (!url) {
    req.statusCode = 404
    req.body = new Error('no url field on payload')
    return error(req, res, next)
  }
  const { redis } = req
  const hid = Hid(url)
  icy.get(url, res => {
    const name = res.headers['icy-name']
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
      req.body = stream
      next()
    })
  }).on('error', _ => {
    req.body = new Error("can't connect to stream")
    error(req, res, next)
  })
}

const fetch = (req, res, next) => {
  if (req.body && req.body.then) return next()
  else if (!req.body) {
    req.body = new Error('no stream')
    return error(req, res, next)
  }
  const { redis, io } = req
  const { id, url } = req.body
  const buffered = new Buffered(160000) // 10s @ 128kbps
  req.body = new Promise((resolve, reject) => {
    const req = icy.get(url, emission => {
      const handler = data => buffered.write(data)
      emission
        .on('data', handler)
        .on('end', _ => {
          io.emit('action', pullStream(id))
          io.emit('action', pauseStream())
          io.emit('action', unsetStream())
          stores.stream.del(key(id))
        })
        .on('metadata', buf => {
          const info = new Info(icy.parse(buf).StreamTitle)
          buffered.emit('info', info)
          redis.hset(key(id), 'info', info.value)
        })
      res.on('close', _ => {
        emission.removeListener('data', handler)
        if (!buffered.listeners('data').length) {
          req.end()
        }
      })
      buffered.on('piped', _ => {
        redis.hincrby(key(id), 'listeners', 1)
        io.emit('action', updateStreams({
          [id]: { $listeners: '+1' }
        }))
      })
      buffered.on('unpiped', _ => {
        redis.hincrby(key(id), 'listeners', -1)
        io.emit('action', updateStreams({
          [id]: { $listeners: '-1' }
        }))
      })
      resolve(buffered)
    }).on('error', reject)
  })
  next()
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
