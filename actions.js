const { createAction } = require('redux-actions')

const pullStream = createAction('PULL_STREAM')
const pauseStream = createAction('PAUSE_STREAM')
const unsetStream = createAction('UNSET_STREAM')
const updateStreams = createAction('UPDATE_STREAMS')

module.exports = {
  pullStream,
  pauseStream,
  unsetStream,
  updateStreams
}
