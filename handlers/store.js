const lru = require('lru-cache')

const stores = {
  stream: lru({
    max: 1000,
    dispose (_, cached) {
      cached.then(inst => inst.unpipe())
    }
  }),
  address: lru({
    max: 10000
  })
}

const cache = space => (req, res, next) => {
  const store = stores[space]
  const { key } = req.params
  if (!store.has(key)) {
    store.set(key, req.body)
  }
  next()
}

const cached = space => (req, res, next) => {
  const store = stores[space]
  const { key } = req.params
  const val = store.get(key)
  if (val) req.body = val
  next()
}

module.exports = {
  stores,
  cache,
  cached
}
