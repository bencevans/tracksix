const fs = require('fs')
const os = require('os')
const path = require('path')
const { EventEmitter } = require('events')
const debug = require('debug')('tracksix')
const gpsd = require('node-gpsd')
const mqtt = require('mqtt')

const relayErrorEvents = (sourceEmitter, drainEmitter) => {
  sourceEmitter.on('error', (err) => {
    drainEmitter.emit('error', err)
  })
}

const configPath = (configFilePath) => {
  return configFilePath
    ? path.resolve(process.cwd(), configFilePath)
    : path.resolve(os.homedir(), './.tracksix.config.json')
}

const readConfig = (configFilePath) => {
  configFilePath = configPath(configFilePath)

  debug('config: reading ' + configFilePath)
  if (fs.existsSync(configFilePath) === false) {
    throw new Error(`Config file not found at '${configFilePath}'`)
  }

  return JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
}

const tracksix = (config) => {
  const emiter = new EventEmitter()

  const gps = new gpsd.Listener()
  relayErrorEvents(gps, emiter)

  gps.connect(() => {
    gps.watch()
    console.log('gpsd: connected')
  })

  const connectionString = `mqtts://${config.username}:${config.password}@${config.host}:${config.port}`

  debug('mqtt connection string: ' + connectionString)
  const mq = mqtt.connect(connectionString, {
    keepalive: config.keepalive,
    rejectUnauthorized: config.allowinvalidcerts === true
  })
  relayErrorEvents(mq, emiter)

  mq.on('connect', () => {
    console.log('mqtt: connected')
  })

  gps.on('TPV', (tpv) => {
    const report = {
      _type: 'location',
      alt: tpv.alt,
      lat: Math.round(tpv.lat * 100000) / 100000,
      lon: Math.round(tpv.lon * 100000) / 100000,
      tid: 'ts',
      tst: Math.round((new Date(tpv.time)).getTime() / 1000)
    }

    debug(tpv)
    emiter.emit('location', report)
    debug('owntracks/' + config.username + '/' + config.deviceId)
    mq.publish('owntracks/' + config.username + '/' + config.deviceId, JSON.stringify(report), {
      retain: true,
      qos: 1
    })
  })

  return emiter
}

module.exports = tracksix
module.exports.readConfigSync = readConfig
