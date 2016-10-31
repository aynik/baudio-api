const fs = require('fs')
const bitcore = require('bitcore-lib')
const PaymentProtocol = require('bitcore-payment-protocol')
const { stores } = require('./store')
const { error } = require('./responses')

const { Address, Script } = bitcore
const { Payment } = PaymentProtocol

const register = (req, res, next) => {
  const body = []
  req
    .on('data', data => body.push(data))
    .on('end', _ => {
      const message = Payment.decode(Buffer.concat(body))
      const refundTo = message.get('refund_to')
      const merchantData = message.get('merchant_data')
      let paymentAddress
      try {
        paymentAddress = Address.fromBuffer(merchantData.toBuffer())
      } catch (err) {
        const { addr } = req.params
        paymentAddress = Address.fromString(addr)
      }
      const key = paymentAddress.toString()
      const refundAddress = Address.fromScript(new Script(
        refundTo[0].script.toBuffer()),
        paymentAddress.network)
      const val = refundAddress.toString()
      stores.address.set(key, val)
      const ack = new PaymentProtocol().makePaymentACK()
      ack.set('payment', message)
      ack.set('memo', 'Processed.')
      req.body = ack.serialize()
      res.setHeader('Content-Type',
        PaymentProtocol.PAYMENT_ACK_CONTENT_TYPE)
      next()
    })
}

const key = fs.readFileSync('./ssl/server.key')

const certificates = new PaymentProtocol()
  .makeX509Certificates()

certificates.set('certificate', [
  fs.readFileSync('./ssl/server.der')
])

const one = (req, res, next) => {
  const { addr } = req.params

  let address
  try {
    address = Address.fromString(addr)
  } catch (err) {
    req.body = new Error('wrong address')
    error(req, res, next)
    return
  }

  const script = Script.buildPublicKeyHashOut(address)
  const details = new PaymentProtocol().makePaymentDetails()
  details.set('network', 'test')

  details.set('outputs', [{
    script: script.toBuffer(),
    amount: 0
  }])

  const now = Date.now() / 1000 | 0

  details.set('time', now)
  details.set('expires', now + (60 * 60 * 24))
  details.set('memo', 'Please fund your baudio wallet.')
  details.set('payment_url', 'https://81.203.62.211:8000/invoice')
  details.set('merchant_data', address.toBuffer())

  const request = new PaymentProtocol()
    .makePaymentRequest()

  request.set('payment_details_version', 1)
  request.set('pki_type', 'x509+sha256')
  request.set('pki_data', certificates.serialize())
  request.set('serialized_payment_details', details.serialize())

  request.sign(key)

  req.body = request.serialize()
  res.setHeader('Content-Type',
    PaymentProtocol.PAYMENT_REQUEST_CONTENT_TYPE)

  next()
}

module.exports = {
  register,
  one
}
