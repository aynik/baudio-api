const Hash = require('./hash')
const Integer = require('./integer')

const Stream = ({ id, name, listeners, bph }) => ({
  id: Hash(id),
  name,
  listeners: Integer(listeners) || 0,
  bph: Integer(bph) || 1
})

Stream.Private = stream => (
  Object.assign(Stream(stream), { url: stream.url })
)

module.exports = Stream
