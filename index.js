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

const validConfig = config => {
  return config
}

class Tracksix extends EventEmitter {
  constructor (config) {
    super()

    this.config = validConfig(config)

    // start services
    this.gps = this.initGps(config)
    this.mqtt = this.initMqtt(config)

    // report information up
    relayErrorEvents(this.gps, this)
    relayErrorEvents(this.mqtt, this)

    this.gps.on('TPV', this.handleTPV.bind(this))
    this.mqtt.on('connect', () => { this.emit('info', 'mqtt: connected') })
  }

  mqttConnectionString () {
    const { auth, username, password, tls, host, port } = this.config
    const authS = auth ? `${username}:${password}@` : ''
    const protoS = tls ? 'mqtts' : 'mqtt'
    return `${protoS}://${authS}${host}:${port}`
  }

  initGps (config) {
    const gps = new gpsd.Listener()

    gps.connect(() => {
      gps.watch()
    })

    return gps
  }

  initMqtt (config) {
    return mqtt.connect(this.mqttConnectionString(), {
      keepalive: config.keepalive,
      rejectUnauthorized: config.allowinvalidcerts === true,
      clean: config.cleanSession,
      clientId: config.clientId || config.username + ' ' + config.deviceId
    })
  }

  handleTPV (tpv) {
    const report = {
      _type: 'location',
      alt: tpv.alt,
      lat: Math.round(tpv.lat * 100000) / 100000,
      lon: Math.round(tpv.lon * 100000) / 100000,
      tid: 'ts',
      tst: Math.round((new Date(tpv.time)).getTime() / 1000)
    }

    this.emit('location', report)

    const config = this.config
    const topic = config.pubTopicBase.replace('%u', config.username).replace('%d', config.deviceId)
    debug(topic)
    this.mqtt.publish(topic, JSON.stringify(report), {
      retain: config.pubRetain,
      qos: config.pubQos
    })
  }
}

const tracksix = (config) => {
  return new Tracksix(config)
}

module.exports = tracksix
module.exports.readConfigSync = readConfig
