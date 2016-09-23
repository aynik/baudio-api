const { error } = require('./responses')

const ok = (req, res, next) => obj => {
  req.body = obj
  next()
}

const fail = (req, res, next) => err => {
  req.body = err
  error(req, res, next)
}

const resolve = (req, res, next) => {
  req.body
    .then(ok(req, res, next))
    .catch(fail(req, res, next))
}

module.exports = {
  resolve
}
