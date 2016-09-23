const Redis = require('ioredis')
const connect = require('connect')
const logger = require('connect-logger')
const cors = require('connect-cors')
const route = require('urlrouter')
const send = require('connect-send-json')
const parse = require('body-parser')
const handlers = require('./handlers')

const app = new connect()

app.use(cors({ credentials: false }))
app.use(logger())
app.use(send.json())
app.use(parse.json())

const redis = new Redis(process.env.REDIS_URL)

app.use((req, res, next) => {
  req.redis = redis
  next()
})

app.use(route(router => {
  const { resolve } = handlers.helpers
  const { cache, cached } = handlers.store

  if (true) {
    const { list, scan, one } = handlers.streams
    const { register, fetch, changes } = handlers.streams
    const { json, mp3, redirect } = handlers.responses

    router.post('/stream', register, redirect)

    router.get('/stream/:id', one, resolve, json,
      cached('stream'), fetch, cache('stream'), mp3)

    router.get('/stream/:id/changes', one, resolve,
      cached('stream'), fetch, changes, json)

    router.get('/streams', list, resolve, json)
    router.get('/streams/:c', scan, resolve, json)
    router.get('/streams/:c/:n', scan, resolve, json)
  }
}))

if (!module.parent) {
  app.listen(process.env.PORT || 3000)
}
