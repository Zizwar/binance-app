const WebSocket = require('ws')
const axios = require('axios')
const qs = require('querystring')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

let logs = []

function monitor(e = 'BTC', threshold = 0.1) {
  console.log(`Started monitoring ${e} at a threshold ${threshold}`)

  let price = 0.0
  const prices = []
  let diffs = 0.0

  const connectStr = `${e.toLowerCase()}usdt@aggTrade`
  const socket = new WebSocket('wss://stream.binance.com:9443/stream?streams=' + connectStr)

  socket.on('message', raw => {
    const data = JSON.parse(raw).data
    const priceUpdate = parseFloat(data.p)
    price = priceUpdate
  })

  const watcher1 = setInterval(() => {
    if (prices.length > 10) {
      prices.push(price)
      prices.shift()
    } else {
      prices.push(price)
    }
  }, 1000)

  const watcher2 = setInterval(() => {
    if (prices.length < 10) {
      return
    }

    const diff = ((prices[9] / prices[0]) - 1)
    diffs += diff
  }, 1000)

  // Watcher
  const watcher3 = setInterval(() => {
    // Big change
    if (diffs > threshold || diffs < -threshold) {
      // Send notify
      console.log('Big change: ' + diffs)
      const positive = `+${threshold * 10}%`
      const negative = `-${threshold * 10}%`
      const msg = `${e} has just modifed ${diffs > 0 ? positive : negative}, current price is ${price}`
      logs.push(msg)
      sendNotify(msg)
      diffs = 0
    }
  }, 1000)

  function stopWatchers() {
    clearInterval(watcher1)
    clearInterval(watcher2)
    clearInterval(watcher3)
    socket.close()
  }

  return { stopWatchers }
}

async function sendNotify(msg, token = 'MFm1y1zojjw2BP7SY8lTymGrcYclaJmWw5PwbYuJ60C') {
  console.log(msg)
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  }
  const obj = {
    message: msg
  }

  const { data } = await axios.post('https://notify-api.line.me/api/notify', qs.stringify(obj), config)
  return data
}

// Global variable
let listWatch = [
  { name: 'ETH', threshold: 0.5 },
  { name: 'BTC', threshold: 0.5 },
]
let stoppers = []

// Start
function main() {
  stoppers = listWatch.map(e => {
    const { stopWatchers } = monitor(e.name, e.threshold)
    return stopWatchers
  })

  const app = express()
  app.use(cors())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  app.get('/list', async function (_, res) {
    res.send({ listWatch })
  })

  app.get('/logs', async function (_, res) {
    res.send({ logs })
  })

  app.delete('/logs/clear', async function (_, res) {
    logs = []
    res.send({ message: 'Success' })
  })

  app.post('/setup', async function (req, res) {
    try {
      listWatch = req.body.listWatch

      stoppers.forEach(stopFn => stopFn())
      stoppers = listWatch.map(e => {
        const { stopWatchers } = monitor(e.name, e.threshold)
        return stopWatchers
      })

      res.send({
        message: 'Success'
      })
    } catch(err) {
      res.status(400).send({
        message: err.message
      })
    }
  })

  const port = process.env.PORT || 8990
  app.listen(port, () => {
    console.log(`Binance watcher server listening at http://localhost:${port}`)
  })
}

main()
