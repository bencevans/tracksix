#!/usr/bin/env node

const tracksix = require('.')

const config = tracksix.readConfigSync(process.argv[2])

const tracker = tracksix(config)

tracker.on('error', err => {
  console.error(err)
  process.exit(1)
})
