const fs = require('fs')
const os = require('os')
const path = require('path')
const { EventEmitter } = require('events')
const debug = require('debug')('tracksix')
const gpsd = require('node-gpsd')
const mqtt = require('mqtt')

const configPath = (configFilePath) => {
  return configFilePath
    ? path.resolve(process.cwd(), configFilePath)
    : path.resolve(os.homedir(), './.tracksix.config.json')
}

const readConfig = (configFilePath) => {
  configFilePath = configPath(configFilePath)

  debug('config: reading ' + configFilePath)
  if (fs.existsSync(configFilePath) === false) {
    throw new Error(`Config file not found at \'${configFilePath}\'`)
  }

  return JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
}

const tracksix = (config) => {
  const emiter = new EventEmitter()

  const gps = new gpsd.Listener({
    port: 2947,
    hostname: 'localhost',
    logger: {
      info: function () {},
      warn: console.warn,
      error: console.error
    },
    parse: true
  })

  gps.connect(() => {
    console.log('gpsd: connected')
  })

  const connectionString = `mqtts://${config.username}:${config.password}@${config.host}:8883`

  debug('mqtt connection string: ' + connectionString)
  const mq = mqtt.connect(connectionString)

  mq.on('connect', () => {
    console.log('mqtt: connected')
  })

  mq.on('error', console.error)

  gps.on('TPV', (tpv) => {
    const report = {
      _type: 'location',
      acc: 8,
      alt: tpv.alt,
      batt: 22,
      conn: 'm',
      lat: Math.round(tpv.lat * 100000) / 100000,
      lon: Math.round(tpv.lon * 100000) / 100000,
      tid: 'ts',
      tst: (new Date(tpv.time)).getTime(),
      vac: 0,
      vel: parseInt(tpv.speed, 10)

      // "acc":700,"alt":0,"batt":88,"conn":"m","lat":51.5336229,"lon":-0.4690348,"tid":"s6","tst":1549898291,"vac":0,"vel":0
    }

    console.log(tpv)
    emiter.emit('location', report)
    mq.publish('owntracks/' + config.username + '/' + config.deviceId, JSON.stringify(report))
  })

  return emiter
}

module.exports = tracksix
module.exports.readConfigSync = readConfig
