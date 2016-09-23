const accepts = require('accepts')

const error = (req, res, next) => {
  if (res.statusCode === 200) {
    res.statusCode = 400
  }
  console.log(req.body)
  res.end(req.body.message)
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
}

const redirect = (req, res, next) => {
  res.writeHead(302, { Location: req.body })
  res.end()
}

module.exports = {
  error,
  json,
  mp3,
  redirect
}
