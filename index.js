const Redis = require('ioredis')
const Koa = require('koa')
const cors = require('koa-cors')
const route = require('koa-route')

const streams = require('./handlers/streams')

const app = new Koa()
const redis = new Redis(process.env.REDIS_URL)

app.use(cors({ credentials: true }))

app.use(route.get('/streams', streams.list(redis)))
app.use(route.get('/streams/:c', streams.scan(redis)))
app.use(route.get('/streams/:c/:n', streams.scan(redis)))

app.use(route.post('/stream', streams.register(redis)))
app.use(route.get('/stream/:id', streams.one(redis)))

if (!module.parent) app.listen(process.env.PORT || 3000)
