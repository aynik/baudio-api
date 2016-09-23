const lru = require('lru-cache')

const { Hash } = require('../models')
const { error } = require('./responses')

const key = (space, id) => `${space}:${id}`

const store = lru({
  max: 1000,
  dispose (_, cached) {
    console.log('dispose', cached)
    cached.then(inst => inst.unpipe())
  }
})

const cache = space => (req, res, next) => {
  const { id } = req.body
  if (!store.has(key(space, id))) {
    store.set(key(space, id), req.body)
  }
  next()
}

const cached = space => (req, res, next) => {
  const { id } = req.params
  const hid = Hash(id)

  if (!hid) {
    req.body = new Error('wrong id')
    return error(req, res, next)
  }

  const cached = store.get(key(space, id))
  if (cached) req.body = cached
  next()
}

module.exports = {
  store,
  cache,
  cached
}
