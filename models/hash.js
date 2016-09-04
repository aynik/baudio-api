const Hash = h => /[a-f0-9]{64}/.test(h) && h

module.exports = Hash
