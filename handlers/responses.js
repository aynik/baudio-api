const accepts = require('accepts')

const error = (req, res, next) => {
  if (res.statusCode === 200) {
    res.statusCode = 400
  }
  res.end(req.body.message)
}

const raw = (req, res, next) => {
  res.end(req.body)
}

const json = (req, res, next) => {
  const accept = accepts(req)
  const type = accept.type(['*/*', 'json'])
  if (type === 'json') {
    res.statusCode = 200
    res.json(req.body)
  } else {
    next()
  }
}

const mp3 = (req, res, next) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'audio/mp3')
  req.body.pipe(res, { end: false })
  res.on('close', _ => req.body.emit('unpiped'))
}

const redirect = (req, res, next) => {
  res.writeHead(303, { Location: req.body })
  res.end()
}

module.exports = {
  error,
  raw,
  json,
  mp3,
  redirect
}
