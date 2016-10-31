const fs = require('fs')
const https = require('https')
const Redis = require('ioredis')
const connect = require('connect')
const logger = require('connect-logger')
const cors = require('connect-cors')
const send = require('connect-send-json')
const parse = require('body-parser')
const route = require('urlrouter')
const socket = require('socket.io')
const handlers = require('./handlers')

const app = new connect()

app.use(cors({ credentials: false }))
app.use(logger())
app.use(send.json())
app.use(parse.json())

const redis = new Redis(process.env.REDIS_URL)

const server = https.createServer({
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.crt')
}, app)

const io = socket(server)

app.use((req, res, next) => {
  req.redis = redis
  req.io = io
  next()
})

app.use(route(router => {
  const { resolve, noempty } = handlers.helpers
  const { cache, cached } = handlers.store
  const { raw, json, mp3 } = handlers.responses

  if (1) { // payment
    const { one, register } = handlers.payments

    router.post('/invoice', register, raw)
    router.post('/invoice/:addr', register, raw)
    router.get('/invoice/:addr', one, raw)
  }

  if (1) { // address
    const { one } = handlers.addresses

    router.get('/address/:addr',
      one, cached('address'), noempty, raw)
  }

  if (1) { // stream
    const { list, scan, one } = handlers.streams
    const { register, fetch, changes } = handlers.streams

    router.post('/stream', register, json)

    router.get('/stream/:hid', one, resolve, json,
      cached('stream'), fetch, cache('stream'),
      resolve, mp3)

    router.get('/stream/:hid/changes', one, resolve,
      cached('stream'), fetch, cache('stream'),
      resolve, changes, json)

    router.get('/streams', list, resolve, json)
    router.get('/streams/:c', scan, resolve, json)
    router.get('/streams/:c/:n', scan, resolve, json)
  }
}))

if (!module.parent) {
  server.listen(process.env.PORT || 8000, '0.0.0.0')
}
